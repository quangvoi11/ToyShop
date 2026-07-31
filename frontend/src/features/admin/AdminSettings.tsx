import { useState } from 'react';
import { Settings, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { changePassword } from '../../api/auth';
import { loginThunk } from '../../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../store';

export default function AdminSettings() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Xác nhận mật khẩu không khớp');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Đổi mật khẩu thành công');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      if (user?.email) {
        try {
          await dispatch(loginThunk({ email: user.email, password: passwordForm.newPassword })).unwrap();
        } catch {
          toast.error('Đổi mật khẩu thành công nhưng đăng nhập lại thất bại. Vui lòng đăng nhập lại.');
        }
      }
    } catch (err) {
      setPasswordError((err as Error).message || 'Không thể đổi mật khẩu');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Cài đặt</h1>
        <p className="text-sm text-gray-500">Quản lý cài đặt cửa hàng</p>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold">Thông tin cửa hàng</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">Tên cửa hàng</label>
            <p className="text-sm">Ele Store</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">Email</label>
            <p className="text-sm">admin@toystShop.com</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">Số điện thoại</label>
            <p className="text-sm">0123 456 789</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">Địa chỉ</label>
            <p className="text-sm">TP. Hồ Chí Minh, Việt Nam</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>
        <p className="text-sm text-gray-500">Tính năng đang được phát triển.</p>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Vận chuyển</h2>
        <p className="text-sm text-gray-500">Tính năng đang được phát triển.</p>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold">Đổi mật khẩu</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">Mật khẩu mới</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          {passwordError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {passwordError}
            </div>
          )}
          <button
            type="submit"
            disabled={passwordLoading}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {passwordLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}
