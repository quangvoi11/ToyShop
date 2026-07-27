import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { slugify } from '@shared/utils/index';

export async function getList() {
  return prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
}

export async function getAll(query: any) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const search = query.search || '';
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (search) {
    where.name = { contains: search };
  }

  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { products: true } } },
    }),
    prisma.brand.count({ where }),
  ]);

  return {
    data: brands,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getById(id: string) {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!brand) throw new AppError('Thương hiệu không tồn tại', 404);
  return brand;
}

export async function create(data: { name: string; slug?: string; logo?: string | null; isActive?: boolean }) {
  const slug = data.slug || slugify(data.name);
  const existing = await prisma.brand.findUnique({ where: { slug } });
  if (existing) throw new AppError('Slug đã tồn tại', 409);

  return prisma.brand.create({
    data: {
      name: data.name,
      slug,
      logo: data.logo || null,
      isActive: data.isActive ?? true,
    },
  });
}

export async function update(id: string, data: { name?: string; slug?: string; logo?: string | null; isActive?: boolean }) {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) throw new AppError('Thương hiệu không tồn tại', 404);

  if (data.slug && data.slug !== brand.slug) {
    const slugExists = await prisma.brand.findUnique({ where: { slug: data.slug } });
    if (slugExists) throw new AppError('Slug đã tồn tại', 409);
  }

  return prisma.brand.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.slug !== undefined ? { slug: data.slug } : {}),
      ...(data.logo !== undefined ? { logo: data.logo } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
}

export async function remove(id: string) {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: { products: { where: { isActive: true }, take: 1 } },
  });
  if (!brand) throw new AppError('Thương hiệu không tồn tại', 404);
  if (brand.products.length > 0) {
    throw new AppError('Không thể xóa thương hiệu đang có sản phẩm hoạt động', 400);
  }

  return prisma.brand.update({
    where: { id },
    data: { isActive: false },
  });
}
