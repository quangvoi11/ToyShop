import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { getMyOrders } from '../api/orders';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { formatCurrency } from '../lib/utils';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-indigo-100 text-indigo-700',
  SHIPPING: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

export default function Orders() {
  const { user } = useSelector((s: RootState) => s.auth);
  const { data: result, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getMyOrders(1),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="container-main py-20 text-center">
        <p className="text-lg font-medium">Vui lòng đăng nhập để xem đơn hàng</p>
        <Link to="/login" className="mt-4 inline-block text-primary hover:underline">Đăng nhập</Link>
      </div>
    );
  }

  return (
    <div className="container-main py-8">
      <h1 className="mb-8 text-2xl font-bold">Đơn hàng của tôi</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border bg-white p-6">
              <div className="mb-3 h-5 w-48 rounded bg-gray-200" />
              <div className="h-4 w-32 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : result?.data?.length > 0 ? (
        <div className="space-y-4">
          {result.data.map((order: any) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block rounded-xl border bg-white p-6 transition-all hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">Đơn hàng #{order.orderCode}</p>
                  <p className="mt-1 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                  <p className="mt-1 text-sm text-gray-500">{order.items?.length || 0} sản phẩm</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{formatCurrency(Number(order.total))}</p>
                  <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">Chưa có đơn hàng nào</p>
          <Link to="/products" className="mt-4 inline-block text-primary hover:underline">Mua sắm ngay</Link>
        </div>
      )}
    </div>
  );
}
