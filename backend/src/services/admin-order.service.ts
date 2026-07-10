import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { Prisma } from '@prisma/client';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export async function getAll(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.OrderWhereInput = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.search) {
    where.orderCode = { contains: params.search };
  }

  const orderBy: Record<string, 'asc' | 'desc'> = {};
  orderBy[params.sortBy || 'createdAt'] = params.sortOrder || 'desc';

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: orders,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      address: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
    },
  });

  if (!order) throw new AppError('Order not found', 404);
  return order;
}

export async function updateStatus(id: string, status: string, cancelReason?: string) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError('Order not found', 404);

  const allowedTransitions = VALID_TRANSITIONS[order.status];
  if (!allowedTransitions || !allowedTransitions.includes(status)) {
    throw new AppError(`Cannot transition from ${order.status} to ${status}`, 400);
  }

  if (status === 'CANCELLED' && !cancelReason) {
    throw new AppError('Cancel reason is required when cancelling order', 400);
  }

  const data: Prisma.OrderUpdateInput = { status };

  if (status === 'DELIVERED') {
    data.deliveredAt = new Date();
  }

  if (status === 'SHIPPING') {
    data.shippedAt = new Date();
  }

  if (status === 'CANCELLED') {
    data.cancelledAt = new Date();
    data.cancelReason = cancelReason;
  }

  return prisma.order.update({ where: { id }, data });
}

export async function updatePaymentStatus(id: string, paymentStatus: string) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError('Order not found', 404);

  return prisma.order.update({
    where: { id },
    data: { paymentStatus },
  });
}
