import { prisma } from '../utils/prisma';

export async function getStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    ordersToday,
    totalProducts,
    totalUsers,
    ordersByStatus,
    recentOrders,
    revenueThisMonthAgg,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { total: true },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.order.groupBy({ by: ['status'], _count: true }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        user: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: monthStart }, paymentStatus: 'PAID' },
      _sum: { total: true },
    }),
  ]);

  const revenueToday = ordersToday.reduce((sum, o) => sum + o.total.toNumber(), 0);

  const statusCounts: Record<string, number> = {};
  for (const item of ordersByStatus) {
    statusCounts[item.status] = item._count;
  }

  const ordersByStatusResult = {
    PENDING: statusCounts['PENDING'] || 0,
    CONFIRMED: statusCounts['CONFIRMED'] || 0,
    PROCESSING: statusCounts['PROCESSING'] || 0,
    SHIPPING: statusCounts['SHIPPING'] || 0,
    DELIVERED: statusCounts['DELIVERED'] || 0,
    CANCELLED: statusCounts['CANCELLED'] || 0,
  };

  return {
    ordersToday: { count: ordersToday.length, revenue: revenueToday },
    totalProducts,
    totalUsers,
    revenueToday,
    revenueThisMonth: revenueThisMonthAgg._sum.total?.toNumber() || 0,
    ordersByStatus: ordersByStatusResult,
    recentOrders,
  };
}
