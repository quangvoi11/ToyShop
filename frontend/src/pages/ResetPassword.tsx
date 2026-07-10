import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(token!, password);
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Link không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-bold">Link không hợp lệ</h1>
          <p className="mt-2 text-sm text-gray-500">Vui lòng yêu cầu đặt lại mật khẩu mới</p>
          <Link to="/forgot-password" className="mt-4 inline-block text-primary hover:underline">Quên mật khẩu</Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h1 className="mt-4 text-xl font-bold">Đặt lại mật khẩu thành công</h1>
          <p className="mt-2 text-sm text-gray-500">Bạn có thể đăng nhập với mật khẩu mới</p>
          <Link to="/login" className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary/90">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <span className="text-4xl">🔐</span>
          <h1 className="mt-3 text-2xl font-bold">Đặt lại mật khẩu</h1>
          <p className="mt-1 text-sm text-gray-500">Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Mật khẩu mới</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border px-4 py-2.5 pr-10 text-sm focus:border-primary focus:outline-none"
                placeholder="Ít nhất 8 ký tự" required minLength={8}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Xác nhận mật khẩu</label>
            <input type="password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              placeholder="Nhập lại mật khẩu" required minLength={8}
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}
