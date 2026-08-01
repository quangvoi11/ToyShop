import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, ChevronDown, Phone } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout, fetchProfile } from '../../store/slices/authSlice';
import AnnouncementBar from '@/components/shared/AnnouncementBar';

const categories = [
  { name: 'LEGO', slug: 'lego' },
  { name: 'Búp bê', slug: 'bup-be' },
  { name: 'Xe điều khiển', slug: 'xe-dieu-khien' },
  { name: 'Đồ chơi giáo dục', slug: 'do-choi-giao-duc' },
  { name: 'Thú nhồi bông', slug: 'thu-nhoi-bong' },
];

export default function Header() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, accessToken } = useAppSelector((s) => s.auth);
  const cartItems = useAppSelector((s) => s.cart.items);

  useEffect(() => {
    if (accessToken && !user) {
      dispatch(fetchProfile());
    }
  }, [accessToken, user, dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <AnnouncementBar />

      {/* Main header */}
      <div className="container-main">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile menu button */}
          <button className="lg:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <img src="/images/logo-header.png" alt="Ele Store" className="h-20 w-auto" />
            <span className="text-xl text-primary  text-blue-400">Ele Store</span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tìm kiếm đồ chơi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-gray-300 bg-gray-50 py-2 pl-4 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-primary p-1.5 text-white"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <a
              href="tel:0961462003"
              className="hidden items-center gap-1 rounded-lg p-2 text-sm hover:bg-gray-100 lg:flex"
            >
              <Phone className="h-4 w-4" />
              <span>096.146.2003</span>
            </a>

            {accessToken && user?.role === 'CUSTOMER' ? (
              <div className="group relative">
                <button className="flex items-center gap-1 rounded-lg p-2 hover:bg-gray-100">
                  <User className="h-5 w-5" />
                  <span className="hidden text-sm md:inline">{user?.firstName}</span>
                </button>
                <div className="invisible absolute right-0 top-full z-50 w-56 rounded-lg border bg-white py-2 shadow-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                  <div className="border-b px-4 py-2">
                    <p className="text-sm font-medium">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>

                  <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    Tài khoản
                  </Link>
                  <Link to="/orders" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    Đơn hàng
                  </Link>
                  <Link to="/wishlist" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    Yêu thích
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      dispatch(logout());
                      navigate('/');
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1 rounded-lg p-2 hover:bg-gray-100"
              >
                <User className="h-5 w-5" />
                <span className="hidden text-sm md:inline">Đăng nhập</span>
              </Link>
            )}

            <Link
              to="/cart"
              className="relative flex items-center gap-1 rounded-lg p-2 hover:bg-gray-100"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItems.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {cartItems.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="hidden border-t bg-white lg:block">
        <div className="container-main">
          <ul className="flex items-center gap-1">
            <li>
              <Link to="/" className="block px-4 py-3 text-sm font-medium hover:text-primary">
                Trang chủ
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat.slug} className="group relative">
                <Link
                  to={`/products?category=${cat.slug}`}
                  className="flex items-center gap-1 px-4 py-3 text-sm font-medium hover:text-primary"
                >
                  {cat.name}
                  <ChevronDown className="h-3 w-3" />
                </Link>
                <div className="invisible absolute left-0 top-full z-50 w-56 rounded-lg border bg-white py-2 shadow-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className="block px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Tất cả {cat.name.toLowerCase()}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenu && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenu(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl animate-slide-in">
            <div className="flex items-center justify-between border-b p-4">
              <span className="font-semibold">Menu</span>
              <button onClick={() => setMobileMenu(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/products?category=${cat.slug}`}
                  className="block border-b py-3 text-sm"
                  onClick={() => setMobileMenu(false)}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
