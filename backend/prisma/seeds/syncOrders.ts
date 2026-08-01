import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DRY_RUN = process.argv.includes('--dry-run');

const localUrl = process.env.DATABASE_URL;
const renderUrl = process.env.RENDER_DATABASE_URL;

if (!localUrl) {
  console.error('[sync] Missing DATABASE_URL (local). Make sure backend/.env is present.');
  process.exit(1);
}
if (!renderUrl) {
  console.error('[sync] Missing RENDER_DATABASE_URL (external URL of Render DB).');
  process.exit(1);
}
if (renderUrl === localUrl) {
  console.error('[sync] Refusing to run: RENDER_DATABASE_URL equals DATABASE_URL.');
  process.exit(1);
}

const local = new PrismaClient({ datasources: { db: { url: localUrl } } });
const render = new PrismaClient({ datasources: { db: { url: renderUrl } } });

async function main() {
  const localOrders = await local.order.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { email: true } },
      address: true,
      items: true,
      transactions: true,
    },
  });
  console.log(`[sync] Local orders: ${localOrders.length}`);

  const [renderUsers, renderProducts, renderVariants, renderAddresses] = await Promise.all([
    render.user.findMany({ select: { id: true, email: true } }),
    render.product.findMany({ select: { id: true, sku: true } }),
    render.productVariant.findMany({ select: { id: true, productId: true, name: true } }),
    render.address.findMany({ select: { id: true, userId: true, street: true, city: true } }),
  ]);

  const emailToId = new Map(renderUsers.map((u) => [u.email.toLowerCase(), u.id]));
  const skuToId = new Map(renderProducts.map((p) => [p.sku, p.id]));
  const addrKey = (a: { userId: string; street: string; city: string }) => `${a.userId}|${a.street}|${a.city}`;
  const addrMap = new Map(renderAddresses.map((a) => [addrKey(a), a.id]));
  const variantMap = new Map(renderVariants.map((v) => [`${v.productId}|${v.name}`, v.id]));

  const renderOrderCount = await render.order.count();
  console.log(`[sync] Render orders (will be deleted): ${renderOrderCount}`);
  console.log(`[sync] Mode: ${DRY_RUN ? 'DRY-RUN (no changes)' : 'APPLY'}`);

  let deleted = 0;
  let created = 0;
  let skipped = 0;
  const skipReasons: Record<string, number> = {};

  if (!DRY_RUN) {
    const del = await render.order.deleteMany();
    deleted = del.count;
    console.log(`[sync] Deleted ${deleted} orders on Render`);
  }

  for (const o of localOrders) {
    const renderUserId = emailToId.get(o.user.email.toLowerCase());
    if (!renderUserId) {
      skipped += 1;
      skipReasons[`user:${o.user.email}`] = (skipReasons[`user:${o.user.email}`] ?? 0) + 1;
      continue;
    }

    let renderAddressId: string | null = null;
    if (o.address) {
      const key = `${renderUserId}|${o.address.street}|${o.address.city}`;
      renderAddressId = addrMap.get(key) ?? null;
      if (!renderAddressId && !DRY_RUN) {
        const createdAddr = await render.address.create({
          data: {
            userId: renderUserId,
            label: o.address.label,
            street: o.address.street,
            ward: o.address.ward,
            district: o.address.district,
            city: o.address.city,
            country: o.address.country,
            isDefault: o.address.isDefault,
            phone: o.address.phone,
            createdAt: o.address.createdAt,
            updatedAt: o.address.updatedAt,
          },
        });
        renderAddressId = createdAddr.id;
        addrMap.set(key, createdAddr.id);
      }
    }

    const items = [];
    let itemOk = true;
    for (const it of o.items) {
      const productId = skuToId.get(it.productSku);
      if (!productId) {
        itemOk = false;
        skipReasons[`product:${it.productSku}`] = (skipReasons[`product:${it.productSku}`] ?? 0) + 1;
        break;
      }
      const variantId = it.variantId && it.variantName ? variantMap.get(`${productId}|${it.variantName}`) ?? null : null;
      items.push({
        productId,
        variantId,
        productName: it.productName,
        productSku: it.productSku,
        variantName: it.variantName,
        price: it.price,
        quantity: it.quantity,
        total: it.total,
        imageUrl: it.imageUrl,
      });
    }
    if (!itemOk) {
      skipped += 1;
      continue;
    }

    if (DRY_RUN) {
      created += 1;
      continue;
    }

    await render.order.create({
      data: {
        orderCode: o.orderCode,
        userId: renderUserId,
        addressId: renderAddressId,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        subtotal: o.subtotal,
        shippingFee: o.shippingFee,
        discount: o.discount,
        total: o.total,
        note: o.note,
        couponCode: o.couponCode,
        shippedAt: o.shippedAt,
        deliveredAt: o.deliveredAt,
        cancelledAt: o.cancelledAt,
        cancelReason: o.cancelReason,
        vnp_TxnRef: o.vnp_TxnRef,
        vnp_TransactionNo: o.vnp_TransactionNo,
        vnp_ResponseCode: o.vnp_ResponseCode,
        vnp_BankCode: o.vnp_BankCode,
        paymentUrl: o.paymentUrl,
        paidAt: o.paidAt,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        items: { create: items },
        transactions: {
          create: o.transactions.map((t) => ({
            gateway: t.gateway,
            type: t.type,
            amount: t.amount,
            status: t.status,
            requestPayload: t.requestPayload,
            responsePayload: t.responsePayload,
            gatewayRef: t.gatewayRef,
            errorMessage: t.errorMessage,
            ipAddress: t.ipAddress,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          })),
        },
      },
    });
    created += 1;
  }

  console.log(`[sync] Done. created=${created} skipped=${skipped}`);
  if (Object.keys(skipReasons).length > 0) {
    console.log('[sync] Skip reasons:', skipReasons);
  }

  await local.$disconnect();
  await render.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await local.$disconnect();
  await render.$disconnect();
  process.exit(1);
});
