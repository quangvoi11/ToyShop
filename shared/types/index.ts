// ─── API ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiError[];
  meta?: PaginationMeta;
}

export interface ApiError {
  field?: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── User ──────────────────────────────────────────────────────

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'STAFF';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
}

// ─── Product ───────────────────────────────────────────────────

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice?: number;
  stock: number;
  isFeatured: boolean;
  primaryImage?: string;
  categoryName: string;
}

export interface ProductDetail extends ProductSummary {
  description?: string;
  sku: string;
  barcode?: string;
  weight?: number;
  brandName?: string;
  images: string[];
  variants: ProductVariantSummary[];
  averageRating?: number;
  reviewCount: number;
  soldCount: number;
  viewCount: number;
}

export interface ProductVariantSummary {
  id: string;
  name: string;
  price: number;
  stock: number;
}

// ─── Order ─────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | 'FAILED';
export type PaymentMethod = 'COD' | 'BANK_TRANSFER' | 'MOMO' | 'VNPAY' | 'CREDIT_CARD';

export interface OrderSummary {
  id: string;
  orderCode: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  itemCount: number;
  createdAt: string;
}

// ─── Auth ──────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

// ─── User Management ───────────────────────────────────────────

export interface AdminUserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

// ─── Order Management ──────────────────────────────────────────

export interface AdminOrderSummary {
  id: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  total: number;
  itemCount: number;
  createdAt: string;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  subtotal: number;
  shippingFee: number;
  discount: number;
  note?: string;
  address: {
    street: string;
    ward: string;
    district: string;
    city: string;
    phone: string;
  };
  items: Array<{
    productName: string;
    productSku: string;
    variantName?: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  cancelReason?: string;
}

// ─── Dashboard ─────────────────────────────────────────────────

export interface DashboardStats {
  ordersToday: { count: number; revenue: number };
  totalProducts: number;
  totalUsers: number;
  revenueToday: number;
  revenueThisMonth: number;
  ordersByStatus: Record<string, number>;
  recentOrders: Array<{
    id: string;
    orderCode: string;
    customerName: string;
    total: number;
    status: OrderStatus;
    createdAt: string;
  }>;
}

// ─── Coupon ────────────────────────────────────────────────────

export interface CouponSummary {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrder?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface CreateCouponRequest {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrder?: number;
  maxDiscount?: number;
  usageLimit?: number;
  startsAt: string;
  expiresAt: string;
}

// ─── Review ────────────────────────────────────────────────────

export interface ReviewSummary {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  userName: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  rating: number;
  title?: string;
  comment?: string;
}

// ─── Upload ────────────────────────────────────────────────────

export interface UploadResponse {
  url: string;
}

// ─── Wishlist (bổ sung) ────────────────────────────────────────

export interface WishlistItemSummary {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  basePrice: number;
  salePrice?: number;
  primaryImage?: string;
  addedAt: string;
}
