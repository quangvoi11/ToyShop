import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package, Users, DollarSign, TrendingUp, ListOrdered } from 'lucide-react';
import { getAdminDashboardStats } from '../../api/admin';
import { formatCurrency } from '../../lib/utils';
import { ORDER_STATUS_LABELS } from '../../../../shared/constants';

const statusColors: Record<string, string> = {
  PENDING: 'text-yellow-600 bg-yellow-100',
  CONFIRMED: 'text-blue-600 bg-blue-100',
  PROCESSING: 'text-purple-600 bg-purple-100',
  SHIPPING: 'text-orange-600 bg-orange-100',
  DELIVERED: 'text-green-600 bg-green-100',
  CANCELLED: 'text-red-600 bg-red-100',
};

const statusBadgeColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPING: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function AdminDashboard() {
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: getAdminDashboardStats,
  });

  const summaryCards = [
    { icon: ShoppingBag, label: 'Đơn hàng hôm nay', value: stats ? String(stats.ordersToday.count) : '—', color: 'text-blue-600 bg-blue-100', link: '/admin/orders' },
    { icon: Package, label: 'Tổng sản phẩm', value: stats ? String(stats.totalProducts) : '—', color: 'text-green-600 bg-green-100', link: '/admin/products' },
    { icon: Users, label: 'Người dùng', value: stats ? String(stats.totalUsers) : '—', color: 'text-purple-600 bg-purple-100', link: '/admin/users' },
    { icon: DollarSign, label: 'Doanh thu hôm nay', value: stats ? formatCurrency(stats.revenueToday) : '—', color: 'text-yellow-600 bg-yellow-100', link: '/admin/orders' },
  ];

  const orderStatusEntries = stats
    ? Object.entries(stats.ordersByStatus).filter(([_, count]) => count > 0)
    : [];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg font-medium">Không thể tải dữ liệu</p>
        <button onClick={() => refetch()} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Tổng quan</h1>

      {/* 4 Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Link key={card.label} to={card.link} className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="mb-4 h-12 w-12 rounded-xl bg-gray-200" />
                <div className="mb-2 h-8 w-24 rounded bg-gray-200" />
                <div className="h-4 w-32 rounded bg-gray-200" />
              </div>
            ) : (
              <>
                <div className={`mb-4 inline-flex rounded-xl p-3 ${card.color}`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <p className="text-3xl font-bold">{card.value}</p>
                <p className="mt-1 text-sm text-gray-500">{card.label}</p>
              </>
            )}
          </Link>
        ))}
      </div>

      {/* Secondary Row */}
      {stats && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Revenue This Month */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-green-100 p-3 text-green-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.revenueThisMonth)}</p>
            <p className="mt-1 text-sm text-gray-500">Doanh thu tháng này</p>
          </div>

          {/* Orders by Status */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-purple-100 p-3 text-purple-600">
              <ListOrdered className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              {orderStatusEntries.map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusColors[status]?.split(' ')[0].replace('text-', 'bg-')}`} />
                    <span>{ORDER_STATUS_LABELS[status] || status}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
              {orderStatusEntries.length === 0 && (
                <p className="text-sm text-gray-400">Không có đơn hàng</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders Table */}
      {stats && stats.recentOrders.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-4 text-lg font-semibold">Đơn hàng gần đây</h2>
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Mã đơn</th>
                  <th className="px-4 py-3 font-medium">Khách hàng</th>
                  <th className="px-4 py-3 font-medium">Tổng tiền</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                    <td className="px-4 py-3 font-medium">{order.orderCode}</td>
                    <td className="px-4 py-3 text-gray-600">{order.customerName}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats && stats.recentOrders.length === 0 && (
        <div className="mt-6 rounded-2xl border bg-white p-12 text-center text-gray-500">
          <ShoppingBag className="mx-auto mb-2 h-8 w-8" />
          <p>Chưa có đơn hàng nào</p>
        </div>
      )}
    </div>
  );
}
