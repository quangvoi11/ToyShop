import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { Prisma } from '@prisma/client';

interface CreateCouponInput {
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minOrder?: number;
  maxDiscount?: number;
  usageLimit?: number;
  startsAt: string;
  expiresAt: string;
}

interface UpdateCouponInput extends Partial<CreateCouponInput> {
  isActive?: boolean;
}

export async function getAll(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.coupon.count(),
  ]);

  return {
    data: coupons,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getById(id: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new AppError('Coupon not found', 404);
  return coupon;
}

export async function create(data: CreateCouponInput) {
  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing) throw new AppError('Coupon code already exists', 409);

  return prisma.coupon.create({
    data: {
      code: data.code,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrder: data.minOrder,
      maxDiscount: data.maxDiscount,
      usageLimit: data.usageLimit,
      startsAt: new Date(data.startsAt),
      expiresAt: new Date(data.expiresAt),
    },
  });
}

export async function update(id: string, data: UpdateCouponInput) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new AppError('Coupon not found', 404);

  if (data.code && data.code !== coupon.code) {
    const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (existing) throw new AppError('Coupon code already exists', 409);
  }

  const updateData: Record<string, unknown> = { ...data };
  if (data.startsAt) updateData.startsAt = new Date(data.startsAt);
  if (data.expiresAt) updateData.expiresAt = new Date(data.expiresAt);

  return prisma.coupon.update({ where: { id }, data: updateData as Prisma.CouponUpdateInput });
}

export async function remove(id: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new AppError('Coupon not found', 404);

  return prisma.coupon.delete({ where: { id } });
}
