import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, X, ShoppingBag, ChevronLeft, ChevronRight, ExternalLink, CreditCard, MapPin, User, Package, FileText, AlertTriangle,
} from 'lucide-react';
import {
  getAdminOrders, getAdminOrder, updateOrderStatus, updateOrderPaymentStatus,
} from '../../api/admin';
import { formatCurrency } from '../../lib/utils';
import { ORDER_STATUS_LABELS } from '../../../../shared/constants';

const statusBadgeColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPING: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

const paymentBadgeColors: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  UNPAID: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
  FAILED: 'bg-red-100 text-red-700',
};

const borderColors: Record<string, string> = {
  PENDING: 'border-l-blue-500',
  CONFIRMED: 'border-l-blue-500',
  PROCESSING: 'border-l-purple-500',
  SHIPPING: 'border-l-orange-500',
  DELIVERED: 'border-l-green-500',
  CANCELLED: 'border-l-red-500',
};

const actionConfig: Record<string, { label: string; color: string; nextStatus: string }[]> = {
  PENDING: [
    { label: 'Xác nhận', color: 'bg-blue-600 hover:bg-blue-700', nextStatus: 'CONFIRMED' },
    { label: 'Hủy đơn', color: 'bg-red-600 hover:bg-red-700', nextStatus: 'CANCELLED' },
  ],
  CONFIRMED: [
    { label: 'Đóng gói', color: 'bg-purple-600 hover:bg-purple-700', nextStatus: 'PROCESSING' },
    { label: 'Hủy đơn', color: 'bg-red-600 hover:bg-red-700', nextStatus: 'CANCELLED' },
  ],
  PROCESSING: [
    { label: 'Giao hàng', color: 'bg-orange-600 hover:bg-orange-700', nextStatus: 'SHIPPING' },
    { label: 'Hủy đơn', color: 'bg-red-600 hover:bg-red-700', nextStatus: 'CANCELLED' },
  ],
  SHIPPING: [
    { label: 'Giao thành công', color: 'bg-green-600 hover:bg-green-700', nextStatus: 'DELIVERED' },
    { label: 'Hủy đơn', color: 'bg-red-600 hover:bg-red-700', nextStatus: 'CANCELLED' },
  ],
};

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [pendingActionStatus, setPendingActionStatus] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const filters: { status?: string; search?: string } = {};
  if (statusFilter) filters.status = statusFilter;
  if (search) filters.search = search;

  const { data: result, isLoading } = useQuery({
    queryKey: ['admin-orders', page, filters],
    queryFn: () => getAdminOrders(page, filters),
  });

  const detailQuery = useQuery({
    queryKey: ['admin-order', selectedId],
    queryFn: () => getAdminOrder(selectedId!),
    enabled: !!selectedId,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status, cancelReason: reason }: { id: string; status: string; cancelReason?: string }) =>
      updateOrderStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      setSelectedId(null);
      setShowCancelPrompt(false);
      setCancelReason('');
      setPendingActionStatus(null);
    },
  });

  const paymentMut = useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: string }) =>
      updateOrderPaymentStatus(id, paymentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order'] });
      setSelectedId(null);
    },
  });

  const handleAction = (status: string) => {
    if (!selectedId) return;
    if (status === 'CANCELLED') {
      setPendingActionStatus(status);
      setShowCancelPrompt(true);
      return;
    }
    statusMut.mutate({ id: selectedId, status });
  };

  const handleConfirmCancel = () => {
    if (!selectedId || !pendingActionStatus) return;
    if (pendingActionStatus === 'CANCELLED' && !cancelReason.trim()) return;
    statusMut.mutate({ id: selectedId, status: pendingActionStatus, cancelReason: cancelReason.trim() });
  };

  const handleViewDetail = (id: string) => {
    setSelectedId(id);
  };

  const orders = result?.data || [];
  const meta = result?.meta;
  const detail = detailQuery.data;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
          <p className="text-sm text-gray-500">{meta?.total || 0} đơn hàng</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Tìm theo mã đơn..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        {(search || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
            className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            <X className="h-4 w-4" /> Xoá lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Mã đơn</th>
              <th className="px-4 py-3 font-medium">Khách hàng</th>
              <th className="px-4 py-3 font-medium">Tổng tiền</th>
              <th className="px-4 py-3 font-medium">TT Thanh toán</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ngày đặt</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-4"><div className="h-4 w-full animate-pulse rounded bg-gray-200" /></td>
                  ))}
                </tr>
              ))
            ) : orders.length > 0 ? (
              orders.map((order: {
                id: string; orderCode: string; total: number; paymentStatus: string; status: string; createdAt: string;
                user?: { firstName: string; lastName: string };
              }) => (
                <tr key={order.id} className={`border-t border-l-4 hover:bg-gray-50 ${borderColors[order.status] || 'border-l-transparent'}`}>
                  <td className="px-4 py-3 font-medium">{order.orderCode}</td>
                  <td className="px-4 py-3 text-gray-600">{order.user?.firstName} {order.user?.lastName}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(Number(order.total))}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentBadgeColors[order.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
                      {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : order.paymentStatus === 'UNPAID' ? 'Chưa thanh toán' : order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleViewDetail(order.id)}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Xem
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="px-4 py-20 text-center text-gray-500">
                <ShoppingBag className="mx-auto mb-2 h-8 w-8" />
                <p>Chưa có đơn hàng nào</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm font-medium ${page === p ? 'bg-primary text-white' : 'border hover:bg-gray-50'}`}
            >{p}</button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10 pb-10">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            {detailQuery.isLoading ? (
              <div className="animate-pulse space-y-4 py-10">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-4 w-full rounded bg-gray-200" />
                ))}
              </div>
            ) : detailQuery.isError ? (
              <div className="py-10 text-center text-red-500">
                <p>Không thể tải chi tiết đơn hàng</p>
                <button onClick={() => detailQuery.refetch()} className="mt-2 text-sm text-blue-600 underline">Thử lại</button>
              </div>
            ) : detail ? (
              <>
                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold">{detail.orderCode}</h2>
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusBadgeColors[detail.status] || 'bg-gray-100 text-gray-800'}`}>
                        {ORDER_STATUS_LABELS[detail.status] || detail.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Ngày đặt: {new Date(detail.createdAt).toLocaleDateString('vi-VN')} -{' '}
                      {new Date(detail.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button onClick={() => { setSelectedId(null); setShowCancelPrompt(false); setCancelReason(''); }}><X className="h-5 w-5" /></button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Customer Info */}
                  <div className="rounded-xl border p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700"><User className="h-4 w-4" /> Khách hàng</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-500">Tên:</span> {detail.customerName}</p>
                      <p><span className="text-gray-500">Email:</span> {detail.customerEmail}</p>
                      <p><span className="text-gray-500">SĐT:</span> {detail.address?.phone || '—'}</p>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="rounded-xl border p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700"><MapPin className="h-4 w-4" /> Địa chỉ giao hàng</h3>
                    <div className="space-y-1 text-sm">
                      <p>{detail.address?.street}</p>
                      <p>{detail.address?.ward}, {detail.address?.district}</p>
                      <p>{detail.address?.city}</p>
                      <p className="text-gray-500">SĐT: {detail.address?.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="mt-4 rounded-xl border p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700"><CreditCard className="h-4 w-4" /> Thanh toán</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Phương thức: <strong>{detail.paymentMethod}</strong></span>
                    <span>Trạng thái: <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentBadgeColors[detail.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
                      {detail.paymentStatus === 'PAID' ? 'Đã thanh toán' : detail.paymentStatus === 'UNPAID' ? 'Chưa thanh toán' : detail.paymentStatus}
                    </span></span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mt-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700"><Package className="h-4 w-4" /> Sản phẩm</h3>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left">
                        <tr>
                          <th className="px-3 py-2 font-medium">Sản phẩm</th>
                          <th className="px-3 py-2 font-medium">SKU</th>
                          <th className="px-3 py-2 font-medium text-right">Đơn giá</th>
                          <th className="px-3 py-2 font-medium text-center">SL</th>
                          <th className="px-3 py-2 font-medium text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.items.map((item, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2">{item.productName}</td>
                            <td className="px-3 py-2 text-gray-500">{item.productSku}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(item.price)}</td>
                            <td className="px-3 py-2 text-center">{item.quantity}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="mt-4 flex justify-end">
                  <div className="w-full max-w-xs space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Tạm tính</span><span>{formatCurrency(detail.subtotal)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Phí ship</span><span>{formatCurrency(detail.shippingFee)}</span></div>
                    {detail.discount > 0 && (
                      <div className="flex justify-between"><span className="text-gray-500">Giảm giá</span><span className="text-red-500">-{formatCurrency(detail.discount)}</span></div>
                    )}
                    <div className="flex justify-between border-t pt-1.5 font-bold"><span>Tổng cộng</span><span>{formatCurrency(Number(detail.total))}</span></div>
                  </div>
                </div>

                {/* Note */}
                {detail.note && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                    <FileText className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>{detail.note}</p>
                  </div>
                )}

                {detail.cancelReason && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p><strong>Lý do hủy:</strong> {detail.cancelReason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <div className="flex flex-wrap gap-2">
                    {(actionConfig[detail.status] || []).map((action) => (
                      <button
                        key={action.nextStatus}
                        onClick={() => handleAction(action.nextStatus)}
                        disabled={statusMut.isPending}
                        className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${action.color}`}
                      >
                        {statusMut.isPending ? 'Đang xử lý...' : action.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {detail.paymentStatus === 'UNPAID' && (
                      <button
                        onClick={() => paymentMut.mutate({ id: selectedId, paymentStatus: 'PAID' })}
                        disabled={paymentMut.isPending}
                        className="rounded-lg border border-green-600 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 disabled:opacity-50"
                      >
                        {paymentMut.isPending ? 'Đang xử lý...' : 'Đã thanh toán'}
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedId(null)}
                      className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Cancel Reason Modal */}
      {showCancelPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Xác nhận hủy đơn hàng</h3>
            <p className="mb-3 text-sm text-gray-600">Vui lòng nhập lý do hủy đơn:</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              rows={3}
              placeholder="Lý do hủy đơn..."
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => { setShowCancelPrompt(false); setCancelReason(''); setPendingActionStatus(null); }}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Quay lại
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={!cancelReason.trim() || statusMut.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {statusMut.isPending ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
