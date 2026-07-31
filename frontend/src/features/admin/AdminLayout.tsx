import { useState, useEffect, useRef } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Package, LayoutDashboard, ShoppingBag, Users, Settings, LogOut, Tag, FolderTree,
  ChevronLeft, ChevronRight, ChevronDown, Menu, Star, Truck, Newspaper, Building2,
} from 'lucide-react';
import { RootState, useAppDispatch } from '../../store';
import { logoutThunk, switchSession } from '../../store/slices/authSlice';

interface MenuItem {
  icon?: typeof Package;
  label: string;
  path?: string;
  roles?: string[];
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/admin', roles: ['ADMIN'] },
  {
    icon: Package,
    label: 'Sản phẩm',
    roles: ['ADMIN', 'STAFF'],
    children: [
      { icon: Package, label: 'Quản lý sản phẩm', path: '/admin/products' },
      { icon: FolderTree, label: 'Quản lý danh mục', path: '/admin/categories' },
      { icon: Tag, label: 'Mã giảm giá', path: '/admin/coupons', roles: ['ADMIN'] },
      { icon: Star, label: 'Đánh giá', path: '/admin/reviews' },
    ],
  },
  { icon: Truck, label: 'Kho hàng', path: '/admin/inventory', roles: ['ADMIN', 'STAFF'] },
  { icon: Newspaper, label: 'Tin tức', path: '/admin/news', roles: ['ADMIN', 'STAFF'] },
  { icon: Building2, label: 'Thương hiệu', path: '/admin/brands', roles: ['ADMIN'] },
  { icon: ShoppingBag, label: 'Đơn hàng', path: '/admin/orders', roles: ['ADMIN', 'STAFF'] },
  { icon: Users, label: 'Người dùng', path: '/admin/users', roles: ['ADMIN'] },
  { icon: Settings, label: 'Cài đặt', path: '/admin/settings', roles: ['ADMIN', 'STAFF'] },
];

function MenuGroup({
  item,
  collapsed,
  location,
  open,
  onToggle,
}: {
  item: MenuItem;
  collapsed: boolean;
  location: ReturnType<typeof useLocation>;
  open: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [flyoutPos, setFlyoutPos] = useState<{ top: number; left: number } | null>(null);

  const childActive = item.children?.some(
    (c) => c.path && (location.pathname === c.path || location.pathname.startsWith(c.path + '/')),
  );

  useEffect(() => {
    if (collapsed && open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      setFlyoutPos({ top: r.top, left: r.right });
    } else {
      setFlyoutPos(null);
    }
  }, [collapsed, open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
          childActive ? 'bg-primary/10 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
        title={collapsed ? item.label : undefined}
      >
        {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </>
        )}
      </button>

      {!collapsed && open && (
        <div className="mt-1 space-y-1">
          {item.children?.map((child) => (
            <MenuLeaf key={child.path} item={child} location={location} isChild />
          ))}
        </div>
      )}

      {flyoutPos && (
        <div
          className="fixed z-50 ml-1 w-48 rounded-lg border border-gray-800 bg-gray-900 p-1 shadow-xl"
          style={{ top: flyoutPos.top, left: flyoutPos.left }}
        >
          {item.children?.map((child) => (
            <MenuLeaf key={child.path} item={child} location={location} />
          ))}
        </div>
      )}
    </div>
  );
}

function MenuLeaf({
  item,
  location,
  isChild = false,
  collapsed = false,
}: {
  item: MenuItem;
  location: ReturnType<typeof useLocation>;
  isChild?: boolean;
  collapsed?: boolean;
}) {
  const active = item.path
    ? location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    : false;
  return (
    <Link
      key={item.path}
      to={item.path!}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        active ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      } ${isChild ? 'pl-9' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
      title={collapsed ? item.label : undefined}
    >
      {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, sessions, activeRole } = useSelector((s: RootState) => s.auth);
  const hasCustomerSession = !!sessions['customer'];

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    menuItems.forEach((item) => {
      if (
        item.children &&
        item.children.some(
          (c) => c.path && (location.pathname === c.path || location.pathname.startsWith(c.path + '/')),
        )
      ) {
        initial[item.label] = true;
      }
    });
    setOpenGroups(initial);
  }, [location.pathname]);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
    const currentSession = activeRole ? sessions[activeRole] : null;
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <img src="/images/logo-admin.png" alt="Ele Store" className="mx-auto mb-4 h-12 w-auto" />
          <h2 className="mb-2 text-lg font-bold">Cần quyền Admin</h2>
          <p className="mb-6 text-sm text-gray-500">
            {currentSession ? `Bạn đang đăng nhập với tài khoản ${currentSession.user.firstName} (${currentSession.user.role}).` : 'Vui lòng đăng nhập với tài khoản Admin.'}
          </p>
          {hasCustomerSession ? (
            <button
              onClick={() => { dispatch(switchSession('admin')); }}
              className="mb-3 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Chuyển sang Admin
            </button>
          ) : (
            <Link
              to="/login"
              className="mb-3 block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Đăng nhập với tài khoản khác
            </Link>
          )}
          <Link to="/" className="block text-sm text-blue-600 hover:underline">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const adminOnlyPaths = menuItems.flatMap((item) => {
    const leaves = item.children ?? [item];
    return leaves.filter((c) => c.roles && !c.roles.includes('STAFF')).map((c) => c.path!);
  });
  if (user.role === 'STAFF' && adminOnlyPaths.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'))) {
    return <Navigate to="/admin/products" replace />;
  }

  const visibleMenuItems = menuItems
    .map((item) => ({
      ...item,
      children: item.children?.filter((c) => !c.roles || c.roles.includes(user.role)),
    }))
    .filter(
      (item) =>
        (!item.roles && (!item.children || item.children.length > 0)) ||
        (item.roles && item.roles.includes(user.role)),
    );

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const renderItem = (item: MenuItem) => {
    if (item.children) {
      return (
        <MenuGroup
          key={item.label}
          item={item}
          collapsed={collapsed}
          location={location}
          open={openGroups[item.label] ?? false}
          onToggle={() => toggleGroup(item.label)}
        />
      );
    }
    return <MenuLeaf key={item.path} item={item} location={location} collapsed={collapsed} />;
  };

  const sidebar = (
    <div className={`relative flex h-full flex-col bg-gray-900 text-gray-300 transition-all ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
        {!collapsed && (
          <Link to="/admin" className="flex items-center gap-2 text-lg font-bold text-white">
            <img src="/images/logo-admin.png" alt="Ele Store" className="h-8 w-auto" />
            <span className="text-base">Admin</span>
          </Link>
        )}
        {collapsed && <img src="/images/logo-admin.png" alt="Ele Store" className="mx-auto h-7 w-auto" />}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleMenuItems.map((item) => renderItem(item))}
      </nav>

      {/* User & Logout */}
      <div className="border-t border-gray-800 p-3">
        {!collapsed && (
          <div className="mb-2 px-3 text-xs text-gray-500">
            <p className="font-medium text-gray-400">{user.firstName} {user.lastName}</p>
            <p>{user.email}</p>
          </div>
        )}
        <button
          onClick={() => { dispatch(logoutThunk()); navigate('/'); }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400"
          title={collapsed ? 'Đăng xuất' : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden border-t border-gray-800 p-3 text-center text-gray-500 hover:text-white lg:block"
      >
        {collapsed ? <ChevronRight className="mx-auto h-5 w-5" /> : <ChevronLeft className="mx-auto h-5 w-5" />}
      </button>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Desktop sidebar */}
      <div className="hidden lg:block flex-shrink-0">{sidebar}</div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">{sidebar}</div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-16 items-center gap-3 border-b bg-white px-4 lg:hidden">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/images/logo-admin.png" alt="Ele Store" className="h-7 w-auto" />
            <span className="text-base font-bold">Ele Store Admin</span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
