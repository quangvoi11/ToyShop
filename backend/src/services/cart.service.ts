import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function getCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, sku: true, basePrice: true, salePrice: true, stock: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: { items: { include: { product: { select: { id: true, name: true, slug: true, sku: true, basePrice: true, salePrice: true, stock: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } } } } } },
    });
  }

  return cart;
}

export async function addItem(userId: string, productId: string, quantity: number, variantId?: string) {
  const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } });
  if (!product) throw new AppError('Product not found', 404);

  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }

  const existing = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
      variantId: variantId ?? null,
    },
  });

  const totalQuantity = (existing?.quantity || 0) + quantity;
  if (product.stock < totalQuantity) {
    throw new AppError(
      `Sản phẩm "${product.name}" không đủ tồn kho (còn ${product.stock}${existing ? `, bạn đã có ${existing.quantity} trong giỏ` : ''})`,
      400,
    );
  }

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, variantId, quantity },
    });
  }

  return getCart(userId);
}

export async function updateItem(userId: string, itemId: string, quantity: number) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new AppError('Cart not found', 404);

  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw new AppError('Item not found', 404);

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { stock: true, name: true },
    });
    if (!product || product.stock < quantity) {
      throw new AppError(
        `Sản phẩm "${product?.name}" không đủ tồn kho (còn ${product?.stock || 0})`,
        400,
      );
    }
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }

  return getCart(userId);
}

export async function removeItem(userId: string, itemId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new AppError('Cart not found', 404);

  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  return getCart(userId);
}
