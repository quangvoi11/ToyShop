import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { validateCoupon } from './coupon.service';

export async function create(data: {
  userId: string;
  addressId: string;
  paymentMethod: string;
  note?: string;
  couponCode?: string;
}) {
  const cart = await prisma.cart.findUnique({
    where: { userId: data.userId },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, sku: true, basePrice: true, salePrice: true, stock: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } } } },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  const address = await prisma.address.findFirst({
    where: { id: data.addressId, userId: data.userId },
  });
  if (!address) throw new AppError('Address not found', 404);

  let subtotal = 0;
  const orderItems = cart.items.map((item) => {
    const price = item.product.salePrice?.toNumber() || item.product.basePrice.toNumber();
    const total = price * item.quantity;
    subtotal += total;
    return {
      productId: item.product.id,
      variantId: item.variantId,
      productName: item.product.name,
      productSku: item.product.sku,
      price,
      quantity: item.quantity,
      total,
      imageUrl: (item.product as any).images?.[0]?.url || null,
    };
  });

  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  let discount = 0;

  if (data.couponCode) {
    const couponResult = await validateCoupon(data.couponCode);
    if (couponResult.valid && subtotal >= (couponResult.minOrder || 0)) {
      const discountValue = couponResult.discountValue;
      if (couponResult.discountType === 'PERCENTAGE') {
        const maxDiscount = couponResult.maxDiscount || Infinity;
        discount = Math.min(subtotal * discountValue / 100, maxDiscount);
      } else {
        discount = Math.min(discountValue, subtotal);
      }
    }
  }

  const total = subtotal + shippingFee - discount;

  const orderCode = `TS${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Validate stock availability before creating order
  for (const item of cart.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.product.id },
      select: { stock: true, name: true },
    });

    if (!product || product.stock < item.quantity) {
      throw new AppError(
        `Sản phẩm "${item.product.name}" không đủ tồn kho (còn ${product?.stock || 0})`,
        400
      );
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderCode,
        userId: data.userId,
        addressId: data.addressId,
        subtotal,
        shippingFee,
        discount,
        total,
        paymentMethod: data.paymentMethod,
        note: data.note,
        items: { create: orderItems },
      },
      include: { items: true },
    });

    if (data.couponCode) {
      await tx.coupon.update({
        where: { code: data.couponCode.toUpperCase() },
        data: { usedCount: { increment: 1 } },
      });
    }

      // Stock is decremented when payment is confirmed (in payment.service.ts)
    // This prevents stock loss when payment fails

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  return order;
}

export async function getByUser(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { items: true },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return {
    data: orders,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getById(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true, address: true },
  });
  if (!order) throw new AppError('Order not found', 404);
  return order;
}

export async function cancelOrder(userId: string, orderId: string, reason?: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });
  if (!order) throw new AppError('Order not found', 404);

  if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
    throw new AppError('Cannot cancel order in current status', 400);
  }

  // Restore stock before cancelling
  await restoreStockOnCancel(orderId);

  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelReason: reason || null,
    },
  });
}

export async function confirmPaymentStock(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new AppError('Order not found', 404);

  // Idempotency: check if stock was already decremented
  const existingTx = await prisma.paymentTransaction.findFirst({
    where: { orderId, status: 'SUCCESS', type: { in: ['IPN', 'RETURN'] } },
  });
  if (existingTx && order.paidAt) return;

  await prisma.$transaction(async (tx) => {
    // Re-check inside transaction to prevent race condition
    const currentOrder = await tx.order.findUnique({ where: { id: orderId } });
    if (currentOrder?.paymentStatus !== 'PAID') {
      throw new AppError('Order payment not confirmed', 400);
    }

    for (const item of order.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stock: true },
      });

      if (!product || product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for product ${item.productId}`, 400);
      }

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          soldCount: { increment: item.quantity },
        },
      });
    }
  });
}

export async function restoreStockOnCancel(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new AppError('Order not found', 404);

  // Only restore stock if order was previously confirmed (stock was decremented)
  const wasStockDecremented = order.status !== 'PENDING';
  if (!wasStockDecremented) return;

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          soldCount: { decrement: item.quantity },
        },
      });
    }
  });
}
