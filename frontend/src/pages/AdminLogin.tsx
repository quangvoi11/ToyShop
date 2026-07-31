import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { loginThunk, clearError } from '../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../store';

export default function AdminLogin() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: 'admin@toyshop.com', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await dispatch(loginThunk(form)).unwrap();
      if (result.user.role === 'ADMIN' || result.user.role === 'STAFF') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch {
      // error handled by slice
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <img src="/images/logo-header.png" alt="Ele Store Admin" className="mx-auto h-16 w-auto" />
            <h1 className="mt-3 text-2xl font-bold text-gray-900">Ele Store Admin</h1>
            <p className="mt-1 text-sm text-gray-500">Đăng nhập vào hệ thống quản trị</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
              <button
                onClick={() => dispatch(clearError())}
                className="float-right font-medium hover:underline"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 mt-6"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link to="/" className="text-blue-600 hover:underline">← Quay về trang chủ</Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">© 2026 Ele Store Admin</p>
      </div>
    </div>
  );
}
