import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

interface ImageInput {
  url: string;
  alt?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

interface CreateProductInput {
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  salePrice?: number;
  sku: string;
  barcode?: string;
  stock: number;
  weight?: number;
  isFeatured?: boolean;
  categoryId: string;
  brandId?: string;
  images?: ImageInput[];
}

interface UpdateProductInput extends Partial<CreateProductInput> {
  isActive?: boolean;
}

export async function getAll(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { variants: true, reviews: true } },
      },
    }),
    prisma.product.count(),
  ]);
  return {
    data: products,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: true,
    },
  });
  if (!product) throw new AppError('Product not found', 404);
  return product;
}

export async function create(data: CreateProductInput) {
  const existing = await prisma.product.findFirst({
    where: { OR: [{ slug: data.slug }, { sku: data.sku }] },
  });
  if (existing) {
    throw new AppError('Product with this slug or SKU already exists', 409);
  }

  const { images, ...productFields } = data;

  return prisma.product.create({
    data: {
      ...productFields,
      brandId: productFields.brandId || undefined,
      images: images && images.length > 0
        ? {
            createMany: {
              data: images.map((img) => ({
                url: img.url,
                alt: img.alt || '',
                isPrimary: img.isPrimary || false,
                sortOrder: img.sortOrder || 0,
              })),
            },
          }
        : undefined,
    },
  });
}

export async function update(id: string, data: UpdateProductInput) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Product not found', 404);

  if (data.slug && data.slug !== product.slug) {
    const slugExists = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (slugExists) throw new AppError('Slug already in use', 409);
  }

  const { images, ...productFields } = data;

  return prisma.product.update({
    where: { id },
    data: {
      ...productFields,
      brandId: productFields.brandId || undefined,
      ...(images !== undefined
        ? {
            images: {
              deleteMany: {},
              createMany: {
                data: images.map((img) => ({
                  url: img.url,
                  alt: img.alt || '',
                  isPrimary: img.isPrimary || false,
                  sortOrder: img.sortOrder || 0,
                })),
              },
            },
          }
        : {}),
    },
  });
}

export async function remove(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Product not found', 404);

  return prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function getBrands() {
  return prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
}
