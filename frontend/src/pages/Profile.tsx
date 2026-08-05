import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User, Package, Heart, MapPin, LogOut, Camera, Plus } from 'lucide-react';
import { RootState, useAppDispatch } from '../store';
import { logoutThunk, fetchProfile } from '../store/slices/authSlice';
import { updateProfile, uploadAvatar } from '../api/auth';
import { getAddresses } from '../api/addresses';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Address {
  id: string;
  label?: string | null;
  recipientName?: string;
  phone: string;
  street: string;
  ward: string;
  city: string;
  isDefault?: boolean;
}

export default function Profile() {
  const { user } = useSelector((s: RootState) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
    enabled: !!user,
  });

  useEffect(() => {
    if (user) {
      setForm({ firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '' });
    }
  }, [user]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const menuItems = [
    { icon: User, label: 'Thông tin tài khoản', desc: 'Quản lý thông tin cá nhân', to: '/profile' },
    { icon: Package, label: 'Đơn hàng', desc: 'Xem lịch sử đơn hàng', to: '/orders' },
    { icon: Heart, label: 'Yêu thích', desc: 'Sản phẩm đã lưu', to: '/wishlist' },
    { icon: MapPin, label: 'Địa chỉ', desc: 'Quản lý địa chỉ giao hàng', to: '/addresses' },
  ];

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploading) return;
    setUploading(true);
    try {
      const { url } = await uploadAvatar(file);
      await updateProfile({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '', avatar: url });
      await dispatch(fetchProfile());
      toast.success('Đã cập nhật ảnh đại diện');
    } catch {
      toast.error('Không thể tải lên ảnh đại diện');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (form.phone.trim().length < 8) {
      toast.error('Số điện thoại phải có ít nhất 8 ký tự');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone.trim(),
      });
      await dispatch(fetchProfile());
      toast.success('Đã cập nhật thông tin');
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-main py-8">
      <h1 className="mb-8 text-2xl font-bold">Tài khoản</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-white p-6 text-center">
            <div className="relative mx-auto mb-4 h-20 w-20">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-primary" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow hover:bg-primary/90">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <h2 className="text-lg font-bold">{user.firstName} {user.lastName}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary uppercase">{user.role}</p>
          </div>

          <div className="mt-4 space-y-1 rounded-xl border bg-white p-2">
            {menuItems.map((item) => (
              <Link key={item.label} to={item.to} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm hover:bg-gray-50">
                <item.icon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </Link>
            ))}
            <button
              onClick={() => { dispatch(logoutThunk()); navigate('/'); }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-6 text-lg font-semibold">Thông tin tài khoản</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-500">Họ</label>
                <input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-500">Tên</label>
                <input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-500">Số điện thoại</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-500">Email</label>
                <input value={user.email} readOnly className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm text-gray-500" />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-6 rounded-lg bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>

          <div className="mt-6 rounded-xl border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Địa chỉ của tôi</h2>
              <Link to="/addresses" className="text-sm font-medium text-primary hover:underline">
                Quản lý địa chỉ
              </Link>
            </div>
            {addresses?.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {addresses.slice(0, 3).map((addr: Address) => (
                  <div key={addr.id} className="relative rounded-lg border p-4">
                    {addr.isDefault && (
                      <span className="absolute right-3 top-3 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        Mặc định
                      </span>
                    )}
                    {addr.label && <p className="mb-1 text-sm font-medium text-gray-700">{addr.label}</p>}
                    <p className="text-sm font-medium">👤 {addr.recipientName || '—'}</p>
                    <p className="text-sm text-gray-600">{addr.street}, {addr.ward}</p>
                    <p className="text-sm text-gray-600">{addr.city}</p>
                    <p className="mt-1 text-sm text-gray-500">📞 {addr.phone}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-6 text-center">
                <p className="text-sm text-gray-500">Chưa có địa chỉ</p>
                <Link to="/addresses" className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
                  <Plus className="h-4 w-4" /> Thêm địa chỉ
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
