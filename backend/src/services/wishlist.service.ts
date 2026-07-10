import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function getWishlist(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        select: { id: true, name: true, slug: true, basePrice: true, salePrice: true, stock: true,
                  images: { where: { isPrimary: true }, take: 1, select: { url: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return items.map((it: any) => ({
    id: it.id,
    productId: it.productId,
    productName: it.product.name,
    productSlug: it.product.slug,
    basePrice: Number(it.product.basePrice),
    salePrice: it.product.salePrice ? Number(it.product.salePrice) : null,
    primaryImage: it.product.images?.[0]?.url || null,
    addedAt: it.createdAt,
  }));
}

export async function addItem(userId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } });
  if (!product) throw new AppError('Product not found', 404);

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) throw new AppError('Already in wishlist', 409);

  await prisma.wishlistItem.create({ data: { userId, productId } });
  return getWishlist(userId);
}

export async function removeItem(userId: string, productId: string) {
  await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
  return getWishlist(userId);
}
