import { prisma } from '../utils/prisma';

export async function getAll() {
  return prisma.category.findMany({
    where: { isActive: true },
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug, isActive: true },
    include: {
      children: { where: { isActive: true } },
      products: {
        where: { isActive: true },
        take: 20,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}
