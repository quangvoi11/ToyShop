import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { verifyEmail, resendVerification } from '../api/auth';
import { toast } from 'sonner';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  const handleResend = async () => {
    if (!email.trim()) return;
    try {
      const res = await resendVerification(email.trim());
      toast.success(res.message || 'Đã gửi lại email xác thực');
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể gửi lại email');
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <img src="/images/logo-header.png" alt="Ele Store" className="mx-auto h-16 w-auto" />
          </div>

          {status === 'loading' && (
            <div className="flex flex-col items-center py-8 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="mt-4 text-sm text-gray-500">Đang xác thực email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold">Xác thực email thành công!</h1>
              <p className="mt-3 text-sm text-gray-500">Tài khoản của bạn đã sẵn sàng để sử dụng.</p>
              <Link
                to="/login"
                className="mt-6 block w-full rounded-lg bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary/90"
              >
                Đăng nhập ngay
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold">Liên kết xác thực không hợp lệ hoặc đã hết hạn</h1>
              <p className="mt-3 text-sm text-gray-500">
                Vui lòng nhập email của bạn để nhận lại liên kết xác thực mới.
              </p>
              <div className="mt-6 flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email của bạn"
                  className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
                <button
                  onClick={handleResend}
                  disabled={!email.trim()}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  Gửi lại
                </button>
              </div>
              <Link to="/login" className="mt-4 inline-block text-sm text-primary hover:underline">
                Quay lại đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
