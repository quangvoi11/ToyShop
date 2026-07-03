import { prisma } from '../utils/prisma';

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
