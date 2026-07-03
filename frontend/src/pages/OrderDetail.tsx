import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package } from 'lucide-react';
import { getOrderById } from '../api/orders';
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

export default function OrderDetail() {
  const { id } = useParams();
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container-main py-8">
        <div className="animate-pulse rounded-xl border bg-white p-6">
          <div className="mb-4 h-6 w-48 rounded bg-gray-200" />
          <div className="mb-3 h-4 w-32 rounded bg-gray-200" />
          <div className="h-4 w-64 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-main py-20 text-center">
        <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <p className="text-lg font-medium text-gray-500">Không tìm thấy đơn hàng</p>
        <Link to="/orders" className="mt-4 inline-block text-primary hover:underline">Quay lại</Link>
      </div>
    );
  }

  return (
    <div className="container-main py-8">
      <Link to="/orders" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        Quay lại đơn hàng
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Đơn hàng #{order.orderCode}</h1>
          <p className="mt-1 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
        </div>
        <span className={`rounded-full px-4 py-1.5 text-sm font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
          {statusLabels[order.status] || order.status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Sản phẩm</h2>
            <div className="space-y-4">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-2xl">🧱</div>
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-gray-500">SKU: {item.productSku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(Number(item.price))}</p>
                    <p className="text-sm text-gray-500">x{item.quantity}</p>
                  </div>
                  <p className="w-24 text-right font-bold">{formatCurrency(Number(item.total))}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Chi tiết</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Tạm tính</span><span>{formatCurrency(Number(order.subtotal))}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phí vận chuyển</span><span>{Number(order.shippingFee) === 0 ? 'Miễn phí' : formatCurrency(Number(order.shippingFee))}</span></div>
              {Number(order.discount) > 0 && <div className="flex justify-between"><span className="text-gray-500">Giảm giá</span><span className="text-green-600">-{formatCurrency(Number(order.discount))}</span></div>}
              <hr />
              <div className="flex justify-between text-lg font-bold"><span>Tổng</span><span className="text-primary">{formatCurrency(Number(order.total))}</span></div>
            </div>
          </div>

          {order.address && (
            <div className="rounded-xl border bg-white p-6">
              <h2 className="mb-3 text-lg font-semibold">Địa chỉ giao hàng</h2>
              <p className="text-sm">{order.address.street}</p>
              <p className="text-sm text-gray-500">{order.address.ward}, {order.address.district}</p>
              <p className="text-sm text-gray-500">{order.address.city}</p>
              <p className="mt-2 text-sm font-medium">📞 {order.address.phone}</p>
            </div>
          )}

          {order.note && (
            <div className="rounded-xl border bg-white p-6">
              <h2 className="mb-3 text-lg font-semibold">Ghi chú</h2>
              <p className="text-sm text-gray-600">{order.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
