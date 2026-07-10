import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Package, LayoutDashboard, ShoppingBag, Users, Settings, LogOut, Tag, FolderTree,
  ChevronLeft, ChevronRight, ChevronDown, Menu,
} from 'lucide-react';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';

interface MenuItem {
  icon?: typeof Package;
  label: string;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/admin' },
  {
    icon: Package,
    label: 'Sản phẩm',
    children: [
      { icon: Package, label: 'Quản lý sản phẩm', path: '/admin/products' },
      { icon: FolderTree, label: 'Quản lý danh mục', path: '/admin/categories' },
      { icon: Tag, label: 'Mã giảm giá', path: '/admin/coupons' },
    ],
  },
  { icon: ShoppingBag, label: 'Đơn hàng', path: '/admin/orders' },
  { icon: Users, label: 'Người dùng', path: '/admin/users' },
  { icon: Settings, label: 'Cài đặt', path: '/admin/settings' },
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
}: {
  item: MenuItem;
  location: ReturnType<typeof useLocation>;
  isChild?: boolean;
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
      } ${isChild ? 'pl-9' : ''}`}
      title={item.label}
    >
      {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
      <span>{item.label}</span>
    </Link>
  );
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s: RootState) => s.auth);

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

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

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
    return <MenuLeaf key={item.path} item={item} location={location} />;
  };

  const sidebar = (
    <div className={`relative flex h-full flex-col bg-gray-900 text-gray-300 transition-all ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
        {!collapsed && (
          <Link to="/admin" className="flex items-center gap-2 text-lg font-bold text-white">
            <span>🧸</span>
            <span>Admin</span>
          </Link>
        )}
        {collapsed && <span className="mx-auto text-lg">🧸</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {menuItems.map((item) => renderItem(item))}
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
          onClick={() => { dispatch(logout()); navigate('/login'); }}
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
          <span className="text-lg font-bold">🧸 Admin</span>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
