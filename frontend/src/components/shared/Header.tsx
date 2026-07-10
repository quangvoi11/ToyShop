import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { RootState } from '../../store';
import { logout, fetchProfile } from '../../store/slices/authSlice';

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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, accessToken } = useSelector((s: RootState) => s.auth);
  const cartItems = useSelector((s: RootState) => s.cart.items);

  useEffect(() => {
    if (accessToken && !user) {
      dispatch(fetchProfile() as any);
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
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground text-xs">
        <div className="container-main flex items-center justify-between py-1.5">
          <span>🚚 Miễn phí giao hàng cho đơn trên 500.000₫</span>
          <div className="flex items-center gap-4">
            <span>Hỗ trợ: 096.146.2003</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container-main">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile menu button */}
          <button className="lg:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <span className="text-3xl">🧸</span>
            <span>ToyShop</span>
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
            {accessToken ? (
              <div className="group relative">
                <button className="flex items-center gap-1 rounded-lg p-2 hover:bg-gray-100">
                  <User className="h-5 w-5" />
                  <span className="hidden text-sm md:inline">{user?.firstName}</span>
                </button>
                <div className="invisible absolute right-0 top-full z-50 w-48 rounded-lg border bg-white py-2 shadow-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100">
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
                  className="block px-4 py-3 text-sm font-medium hover:text-primary"
                >
                  {cat.name}
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

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="border-t lg:hidden">
          <div className="container-main py-4">
            <form onSubmit={handleSearch} className="mb-4 md:hidden">
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
      )}
    </header>
  );
}
