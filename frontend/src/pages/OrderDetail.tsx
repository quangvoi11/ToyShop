import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Package, XCircle, Check } from 'lucide-react';
import { getOrderById, cancelOrder } from '../api/orders';
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

const paymentMethodLabels: Record<string, string> = {
  COD: 'Thanh toán khi nhận',
  BANK_TRANSFER: 'Chuyển khoản',
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
  CREDIT_CARD: 'Thẻ tín dụng',
};

const paymentStatusColors: Record<string, string> = {
  UNPAID: 'bg-red-100 text-red-700',
  PAID: 'bg-green-100 text-green-700',
  REFUNDED: 'bg-yellow-100 text-yellow-700',
  FAILED: 'bg-gray-100 text-gray-700',
};

const paymentStatusLabels: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  REFUNDED: 'Đã hoàn tiền',
  FAILED: 'Thất bại',
};

const steps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED'];

interface OrderItem {
  id: string;
  productName: string;
  productSku: string;
  price: number;
  quantity: number;
  total: number;
  imageUrl?: string;
}

export default function OrderDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id!),
    enabled: !!id,
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelOrder(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', id] }),
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

  const currentIdx = steps.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="container-main py-8">
      <Link to="/orders" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        Quay lại đơn hàng
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Đơn hàng #{order.orderCode}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString('vi-VN')} - {order.items?.length || 0} sản phẩm
          </p>
        </div>
        <span className={`rounded-full px-4 py-1.5 text-sm font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
          {statusLabels[order.status] || order.status}
        </span>
      </div>

      {/* Timeline */}
      {!isCancelled ? (
        <div className="mb-6 rounded-xl border bg-white p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, i) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  i <= currentIdx ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {i < currentIdx ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <p className={`mt-1 text-xs ${i <= currentIdx ? 'font-medium text-primary' : 'text-gray-400'}`}>
                  {statusLabels[step]}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1 text-xs text-gray-500">
            <p>Đặt hàng: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
            {order.shippedAt && <p>Đã giao cho vận chuyển: {new Date(order.shippedAt).toLocaleString('vi-VN')}</p>}
            {order.deliveredAt && <p>Đã giao hàng: {new Date(order.deliveredAt).toLocaleString('vi-VN')}</p>}
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-500" />
            <div>
              <p className="font-medium text-red-700">Đơn hàng đã bị hủy</p>
              <p className="text-sm text-red-600">
                Hủy lúc: {order.cancelledAt ? new Date(order.cancelledAt).toLocaleString('vi-VN') : ''}
                {order.cancelReason && ` - Lý do: ${order.cancelReason}`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Sản phẩm</h2>
            <div className="space-y-4">
              {order.items?.map((item: OrderItem) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl">🧱</span>
                    )}
                  </div>
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

          {/* Payment */}
          {order.paymentMethod && (
            <div className="rounded-xl border bg-white p-6">
              <h2 className="mb-3 text-lg font-semibold">Thanh toán</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Phương thức</span>
                  <span>{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Trạng thái</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStatusColors[order.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
                    {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

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

          {/* Cancel button */}
          {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
            <button
              onClick={() => { if (window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) cancelMut.mutate(); }}
              disabled={cancelMut.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              {cancelMut.isPending ? 'Đang hủy...' : 'Hủy đơn hàng'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
