import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function create(data: {
  userId: string;
  addressId: string;
  paymentMethod: string;
  note?: string;
}) {
  const cart = await prisma.cart.findUnique({
    where: { userId: data.userId },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, sku: true, basePrice: true, salePrice: true } } },
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
    };
  });

  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  const orderCode = `TS${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderCode,
        userId: data.userId,
        addressId: data.addressId,
        subtotal,
        shippingFee,
        total,
        paymentMethod: data.paymentMethod,
        note: data.note,
        items: { create: orderItems },
      },
      include: { items: true },
    });

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
