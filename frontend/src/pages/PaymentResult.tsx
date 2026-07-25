import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');

  const isSuccess = status === 'success';

  return (
    <div className="container-main py-20 text-center">
      {isSuccess ? (
        <>
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="mb-2 text-2xl font-bold text-green-700">Thanh toán thành công!</h1>
          <p className="mb-6 text-gray-600">Đơn hàng của bạn đã được xác nhận và đang được xử lý.</p>
        </>
      ) : status === 'cancelled' ? (
        <>
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
          <h1 className="mb-2 text-2xl font-bold text-yellow-700">Thanh toán đã bị hủy</h1>
          <p className="mb-6 text-gray-600">Bạn đã hủy giao dịch thanh toán.</p>
        </>
      ) : (
        <>
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h1 className="mb-2 text-2xl font-bold text-red-700">Thanh toán thất bại</h1>
          <p className="mb-6 text-gray-600">Giao dịch không thành công. Vui lòng thử lại.</p>
        </>
      )}

      <div className="flex items-center justify-center gap-4">
        {orderId && (
          <Link
            to={`/orders/${orderId}`}
            className="rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-primary/90"
          >
            Xem đơn hàng
          </Link>
        )}
        <Link
          to="/orders"
          className="rounded-lg border px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          Đơn hàng của tôi
        </Link>
      </div>
    </div>
  );
}
