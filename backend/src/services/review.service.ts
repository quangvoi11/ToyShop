import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function getProductReviews(productId: string, page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId, isActive: true },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { productId, isActive: true } }),
  ]);

  return {
    data: reviews.map((r) => {
      const { user, ...rest } = r;
      return { ...rest, userName: [user.firstName, user.lastName].filter(Boolean).join(' ') };
    }),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createReview(userId: string, productId: string, data: { rating: number; title?: string; comment?: string }) {
  const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } });
  if (!product) throw new AppError('Product not found', 404);

  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) throw new AppError('You have already reviewed this product', 409);

  const review = await prisma.review.create({
    data: { userId, productId, ...data },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });
  const { user, ...rest } = review;
  return { ...rest, userName: [user.firstName, user.lastName].filter(Boolean).join(' ') };
}
