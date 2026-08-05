import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { registerThunk, clearError } from '../store/slices/authSlice';
import { resendVerification } from '../api/auth';
import { useAppDispatch, useAppSelector } from '../store';
import { toast } from 'sonner';

export default function Register() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [validationError, setValidationError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (form.password !== form.confirmPassword) {
      setValidationError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (form.password.length < 8) {
      setValidationError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    try {
      await dispatch(registerThunk(form)).unwrap();
      setRegisteredEmail(form.email);
    } catch {
      // error handled by slice
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !registeredEmail) return;
    try {
      const res = await resendVerification(registeredEmail);
      toast.success(res.message || 'Đã gửi lại email xác thực');
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể gửi lại email');
    }
  };

  const displayError = validationError || error;

  if (registeredEmail) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <div className="mb-8 text-center">
              <img src="/images/logo-header.png" alt="Ele Store" className="mx-auto h-16 w-auto" />
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Kiểm tra email của bạn</h1>
              <p className="mt-3 text-sm text-gray-500">
                Chúng tôi đã gửi liên kết xác thực tới{' '}
                <span className="font-medium text-gray-700">{registeredEmail}</span>. Vui lòng kiểm tra hộp thư (kể cả thư rác).
              </p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="w-full rounded-lg bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Gửi lại email (${resendCooldown}s)` : 'Gửi lại email'}
                </button>
                <Link
                  to="/login"
                  className="block w-full rounded-lg border px-6 py-2.5 font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Quay lại đăng nhập
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <img src="/images/logo-header.png" alt="Ele Store" className="mx-auto h-16 w-auto" />
            <h1 className="mt-3 text-2xl font-bold">Đăng ký</h1>
            <p className="mt-1 text-sm text-gray-500">Tạo tài khoản Ele Store</p>
          </div>

          {displayError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {displayError}
              <button onClick={() => { setValidationError(''); dispatch(clearError()); }} className="float-right font-medium hover:underline">×</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Họ</label>
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Tên</label>
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" required />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" required />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Số điện thoại</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Mật khẩu</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" required />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Xác nhận mật khẩu</label>
              <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" required />
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
