import api from './axios';
import type {
  DashboardStats,
  AdminOrderDetail,
  AdminUserSummary,
  CouponSummary,
  CreateCouponRequest,
} from '../../../shared/types';

interface ProductImageInput {
  url: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  salePrice: number | null;
  sku: string;
  barcode: string;
  stock: number;
  weight: number | null;
  isFeatured: boolean;
  isActive: boolean;
  categoryId: string;
  brandId: string | null;
  images: ProductImageInput[];
}

export async function getAdminProducts(page = 1) {
  const { data } = await api.get('/admin/products', { params: { page, limit: 20 } });
  return data;
}

export async function getAdminProduct(id: string) {
  const { data } = await api.get(`/admin/products/${id}`);
  return data.data;
}

export async function createProduct(body: ProductForm) {
  const { data } = await api.post('/admin/products', body);
  return data.data;
}

export async function updateProduct(id: string, body: ProductForm) {
  const { data } = await api.put(`/admin/products/${id}`, body);
  return data.data;
}

export async function deleteProduct(id: string) {
  const { data } = await api.delete(`/admin/products/${id}`);
  return data;
}

export async function getAdminCategories() {
  const { data } = await api.get('/admin/categories/flat');
  return data.data;
}

export async function getAdminCategoryTree() {
  const { data } = await api.get('/admin/categories');
  return data.data;
}

export async function getAdminCategory(id: string) {
  const { data } = await api.get(`/admin/categories/${id}`);
  return data.data;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export async function createCategory(body: CategoryInput) {
  const { data } = await api.post('/admin/categories', body);
  return data.data;
}

export async function updateCategory(id: string, body: CategoryInput) {
  const { data } = await api.put(`/admin/categories/${id}`, body);
  return data.data;
}

export async function deleteCategory(id: string) {
  const { data } = await api.delete(`/admin/categories/${id}`);
  return data;
}

export async function getAdminBrands() {
  const { data } = await api.get('/admin/brands');
  return data.data;
}

// ===== Dashboard =====

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get('/admin/dashboard/stats');
  return data.data;
}

// ===== Orders =====

export async function getAdminOrders(page = 1, filters?: { status?: string; search?: string }) {
  const { data } = await api.get('/admin/orders', { params: { page, limit: 20, ...filters } });
  return data;
}

export async function getAdminOrder(id: string): Promise<AdminOrderDetail> {
  const { data } = await api.get(`/admin/orders/${id}`);
  return data.data;
}

export async function updateOrderStatus(id: string, status: string, cancelReason?: string) {
  const { data } = await api.patch(`/admin/orders/${id}/status`, { status, cancelReason });
  return data.data;
}

export async function updateOrderPaymentStatus(id: string, paymentStatus: string) {
  const { data } = await api.patch(`/admin/orders/${id}/payment`, { paymentStatus });
  return data.data;
}

// ===== Upload =====

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await api.post('/upload', formData);
  return data.data.url;
}

export async function uploadMultipleImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append('images', f));
  const { data } = await api.post('/upload/multiple', formData);
  return data.data.urls;
}

// ===== Users =====

export async function getAdminUsers(page = 1, search?: string, role?: string) {
  const { data } = await api.get('/admin/users', { params: { page, limit: 20, search, role } });
  return data;
}

export async function getAdminUser(id: string): Promise<AdminUserSummary> {
  const { data } = await api.get(`/admin/users/${id}`);
  return data.data;
}

export async function updateUserStatus(id: string, isActive: boolean) {
  const { data } = await api.patch(`/admin/users/${id}/status`, { isActive });
  return data.data;
}

export async function updateUserRole(id: string, role: string) {
  const { data } = await api.patch(`/admin/users/${id}/role`, { role });
  return data.data;
}

// ===== Coupons =====

export async function getAdminCoupons(page = 1) {
  const { data } = await api.get('/admin/coupons', { params: { page, limit: 20 } });
  return data;
}

export async function getAdminCoupon(id: string): Promise<CouponSummary> {
  const { data } = await api.get(`/admin/coupons/${id}`);
  return data.data;
}

export async function createCoupon(body: CreateCouponRequest) {
  const { data } = await api.post('/admin/coupons', body);
  return data.data;
}

export async function updateCoupon(id: string, body: Partial<CreateCouponRequest>) {
  const { data } = await api.put(`/admin/coupons/${id}`, body);
  return data.data;
}

export async function deleteCoupon(id: string) {
  const { data } = await api.delete(`/admin/coupons/${id}`);
  return data;
}
