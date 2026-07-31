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

export async function getAdminBrands(page = 1) {
  const { data } = await api.get('/admin/brands', { params: { page, limit: 20 } });
  return data;
}

export async function getAdminBrand(id: string) {
  const { data } = await api.get(`/admin/brands/${id}`);
  return data.data;
}

export async function createBrand(body: { name: string; slug?: string; logo?: string; isActive?: boolean }) {
  const { data } = await api.post('/admin/brands', body);
  return data.data;
}

export async function updateBrand(id: string, body: { name?: string; slug?: string; logo?: string; isActive?: boolean }) {
  const { data } = await api.put(`/admin/brands/${id}`, body);
  return data.data;
}

export async function deleteBrand(id: string) {
  const { data } = await api.delete(`/admin/brands/${id}`);
  return data;
}

// ===== Reviews (Admin) =====

export async function getAdminReviews(params: { page?: number; rating?: number; isActive?: boolean; search?: string }) {
  const { data } = await api.get('/admin/reviews', { params: { limit: 20, ...params } });
  return data;
}

export async function toggleReviewActive(id: string) {
  const { data } = await api.patch(`/admin/reviews/${id}/toggle`);
  return data.data;
}

export async function deleteReview(id: string) {
  const { data } = await api.delete(`/admin/reviews/${id}`);
  return data;
}

// ===== Articles (Admin) =====

export async function getAdminArticles(params: { page?: number; isPublished?: boolean; categoryId?: string; search?: string }) {
  const { data } = await api.get('/admin/articles', { params: { limit: 20, ...params } });
  return data;
}

export async function getAdminArticle(id: string) {
  const { data } = await api.get(`/admin/articles/${id}`);
  return data.data;
}

export async function createArticle(body: { title: string; slug?: string; content: string; excerpt?: string; thumbnail?: string; tags?: string; categoryId?: string; isPublished?: boolean; seoTitle?: string; seoDescription?: string }) {
  const { data } = await api.post('/admin/articles', body);
  return data.data;
}

export async function updateArticle(id: string, body: Partial<Parameters<typeof createArticle>[0]>) {
  const { data } = await api.put(`/admin/articles/${id}`, body);
  return data.data;
}

export async function deleteArticle(id: string) {
  const { data } = await api.delete(`/admin/articles/${id}`);
  return data;
}

export async function toggleArticlePublish(id: string) {
  const { data } = await api.patch(`/admin/articles/${id}/publish`);
  return data.data;
}

// ===== Inventory (Admin) =====

export async function getAdminInventory(params: { page?: number; search?: string }) {
  const { data } = await api.get('/admin/inventory', { params: { limit: 20, ...params } });
  return data;
}

export async function adjustStock(body: { productId: string; variantId?: string; warehouseId: string; type: string; quantity: number; note?: string; reference?: string; batchId?: string }) {
  const { data } = await api.post('/admin/inventory/adjust', body);
  return data.data;
}

export async function getAdminMovements(params: { page?: number; productId?: string; warehouseId?: string; type?: string; dateFrom?: string; dateTo?: string }) {
  const { data } = await api.get('/admin/inventory/movements', { params: { limit: 20, ...params } });
  return data;
}

export async function getAdminWarehouses() {
  const { data } = await api.get('/admin/warehouses');
  return data.data;
}

export async function createWarehouse(body: { name: string; address?: string }) {
  const { data } = await api.post('/admin/warehouses', body);
  return data.data;
}

export async function updateWarehouse(id: string, body: { name?: string; address?: string }) {
  const { data } = await api.put(`/admin/warehouses/${id}`, body);
  return data.data;
}

export async function deleteWarehouse(id: string) {
  const { data } = await api.delete(`/admin/warehouses/${id}`);
  return data;
}

export async function getAdminBatches(params: { page?: number; productId?: string; warehouseId?: string }) {
  const { data } = await api.get('/admin/batches', { params: { limit: 20, ...params } });
  return data;
}

export async function createBatch(body: { productId: string; variantId?: string; warehouseId: string; batchCode: string; quantity: number; costPrice: number; expiryDate?: string }) {
  const { data } = await api.post('/admin/batches', body);
  return data.data;
}

export async function updateBatch(id: string, body: { batchCode?: string; costPrice?: number; expiryDate?: string }) {
  const { data } = await api.put(`/admin/batches/${id}`, body);
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

export async function uploadImage(file: File, folder?: string): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await api.post('/upload', formData, { params: folder ? { folder } : undefined });
  return data.data.url;
}

export async function uploadMultipleImages(files: File[], folder?: string): Promise<string[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append('images', f));
  const { data } = await api.post('/upload/multiple', formData, { params: folder ? { folder } : undefined });
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

export async function resetUserPassword(id: string, newPassword: string) {
  const { data } = await api.post(`/admin/users/${id}/reset-password`, { newPassword });
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
