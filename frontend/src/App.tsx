import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorBoundary from './components/shared/ErrorBoundary';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './features/admin/AdminLayout';
import AdminDashboard from './features/admin/AdminDashboard';
import AdminProducts from './features/admin/AdminProducts';
import AdminOrders from './features/admin/AdminOrders';
import AdminUsers from './features/admin/AdminUsers';
import AdminCoupons from './features/admin/AdminCoupons';
import AdminCategories from './features/admin/AdminCategories';
import AdminBrands from './features/admin/AdminBrands';
import AdminReviews from './features/admin/AdminReviews';
import AdminNews from './features/admin/AdminNews';
import AdminInventory from './features/admin/AdminInventory';
import AdminSettings from './features/admin/AdminSettings';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Wishlist from './pages/Wishlist';
import Addresses from './pages/Addresses';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PaymentResult from './pages/PaymentResult';
import AdminLogin from './pages/AdminLogin';

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <ErrorBoundary>
        <Routes>
      <Route element={<MainLayout />}>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/payment/result" element={<PaymentResult />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/addresses" element={<Addresses />} />
        </Route>
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route element={<ProtectedRoute roles={['ADMIN', 'STAFF']} redirectTo="/admin/login" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/brands" element={<AdminBrands />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/news" element={<AdminNews />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>
    </Routes>
      </ErrorBoundary>
    </>
  );
}
