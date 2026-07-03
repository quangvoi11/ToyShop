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
