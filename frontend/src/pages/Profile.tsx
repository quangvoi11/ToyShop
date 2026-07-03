import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { User, Package, Heart, MapPin, LogOut } from 'lucide-react';
import { RootState } from '../store';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  const menuItems = [
    { icon: User, label: 'Thông tin tài khoản', desc: 'Quản lý thông tin cá nhân', to: '/profile' },
    { icon: Package, label: 'Đơn hàng', desc: 'Xem lịch sử đơn hàng', to: '/orders' },
    { icon: Heart, label: 'Yêu thích', desc: 'Sản phẩm đã lưu', to: '/wishlist' },
    { icon: MapPin, label: 'Địa chỉ', desc: 'Quản lý địa chỉ giao hàng', to: '/profile' },
  ];

  return (
    <div className="container-main py-8">
      <h1 className="mb-8 text-2xl font-bold">Tài khoản</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-white p-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <User className="h-10 w-10 text-primary" />
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
              onClick={() => { dispatch(logout()); navigate('/'); }}
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
                <p className="font-medium">{user.lastName}</p>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-500">Tên</label>
                <p className="font-medium">{user.firstName}</p>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-500">Email</label>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-500">Vai trò</label>
                <p className="font-medium uppercase">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
