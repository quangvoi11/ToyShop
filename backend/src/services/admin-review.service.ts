import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function getAll(query: any) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.rating) where.rating = Number(query.rating);
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
  if (query.productId) where.productId = query.productId;
  if (query.search) {
    where.OR = [
      { comment: { contains: query.search } },
      { user: { email: { contains: query.search } } },
      { product: { name: { contains: query.search } } },
    ];
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    data: reviews,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getById(id: string) {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!review) throw new AppError('Đánh giá không tồn tại', 404);
  return review;
}

export async function toggleActive(id: string) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new AppError('Đánh giá không tồn tại', 404);

  return prisma.review.update({
    where: { id },
    data: { isActive: !review.isActive },
  });
}

export async function remove(id: string) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new AppError('Đánh giá không tồn tại', 404);

  return prisma.review.delete({ where: { id } });
}
