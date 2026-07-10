import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function getById(id: string, userId: string) {
  const address = await prisma.address.findFirst({ where: { id, userId } });
  if (!address) throw new AppError('Address not found', 404);
  return address;
}

export async function getAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: { isDefault: 'desc' },
  });
}

export async function create(data: {
  userId: string;
  label?: string;
  street: string;
  ward: string;
  district: string;
  city: string;
  phone: string;
  isDefault?: boolean;
}) {
  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId: data.userId }, data: { isDefault: false } });
  }
  return prisma.address.create({ data });
}

export async function update(id: string, userId: string, data: {
  label?: string;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  phone?: string;
  isDefault?: boolean;
}) {
  const address = await prisma.address.findFirst({ where: { id, userId } });
  if (!address) throw new AppError('Address not found', 404);

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, id: { not: id } },
      data: { isDefault: false },
    });
  }

  return prisma.address.update({ where: { id }, data });
}

export async function remove(id: string, userId: string) {
  const address = await prisma.address.findFirst({ where: { id, userId } });
  if (!address) throw new AppError('Address not found', 404);

  return prisma.address.delete({ where: { id } });
}
