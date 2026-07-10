import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { Prisma } from '@prisma/client';

export async function getAll(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  if (params.search) {
    where.OR = [
      { email: { contains: params.search } },
      { firstName: { contains: params.search } },
      { lastName: { contains: params.search } },
    ];
  }

  if (params.role) {
    where.role = params.role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { orders: true, reviews: true, addresses: true } },
    },
  });

  if (!user) throw new AppError('User not found', 404);

  const orderAgg = await prisma.order.aggregate({
    where: { userId: id, paymentStatus: 'PAID' },
    _sum: { total: true },
  });

  return {
    ...user,
    totalSpent: orderAgg._sum.total?.toNumber() || 0,
  };
}

export async function updateStatus(id: string, isActive: boolean) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('User not found', 404);

  return prisma.user.update({
    where: { id },
    data: { isActive },
    select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
  });
}

export async function updateRole(id: string, role: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('User not found', 404);

  return prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });
}
