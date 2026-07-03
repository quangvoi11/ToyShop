import { prisma } from '../utils/prisma';

export async function getAll(params: {
  page?: number;
  limit?: number;
  categorySlug?: string;
  search?: string;
  sort?: string;
}) {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 100);
  const skip = (page - 1) * limit;

  const where: any = { isActive: true };

  if (params.categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: params.categorySlug } });
    if (category) where.categoryId = category.id;
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { description: { contains: params.search } },
    ];
  }

  const orderBy: any = params.sort === 'price_asc'
    ? { basePrice: 'asc' }
    : params.sort === 'price_desc'
    ? { basePrice: 'desc' }
    : params.sort === 'newest'
    ? { createdAt: 'desc' }
    : { createdAt: 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: products,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { where: { isActive: true } },
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!product) return null;

  const reviews = await prisma.review.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
    _count: true,
  });

  return {
    ...product,
    averageRating: reviews._avg.rating || 0,
    reviewCount: reviews._count,
  };
}

export async function getFeatured() {
  return prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    take: 8,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      category: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
