import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { loginThunk, clearError } from '../store/slices/authSlice';
import { resendVerification } from '../api/auth';
import { useAppDispatch, useAppSelector } from '../store';
import { toast } from 'sonner';

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await dispatch(loginThunk({ ...form, portal: 'customer' }));
    if (loginThunk.rejected.match(res)) {
      const code = (res.payload as { code?: string } | undefined)?.code ?? (res.error as { code?: string } | undefined)?.code;
      if (code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(form.email);
      }
      return;
    }
    navigate('/');
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !unverifiedEmail.trim()) return;
    try {
      const res = await resendVerification(unverifiedEmail.trim());
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

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <img src="/images/logo-header.png" alt="Ele Store" className="mx-auto h-16 w-auto" />
            <h1 className="mt-3 text-2xl font-bold">Đăng nhập</h1>
            <p className="mt-1 text-sm text-gray-500">Chào mừng bạn quay lại Ele Store</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
              <button onClick={() => dispatch(clearError())} className="float-right font-medium hover:underline">×</button>
            </div>
          )}

          {unverifiedEmail && (
            <div className="mb-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
              <p className="font-medium">Tài khoản chưa được xác thực email. Vui lòng kiểm tra hộp thư.</p>
              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  value={unverifiedEmail}
                  onChange={(e) => setUnverifiedEmail(e.target.value)}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                />
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || !unverifiedEmail.trim()}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : 'Gửi lại email xác thực'}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-lg border px-4 py-2.5 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">Đăng ký</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
