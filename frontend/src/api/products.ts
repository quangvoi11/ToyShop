import api from './axios';

export async function getProducts(params?: Record<string, string | number>) {
  const { data } = await api.get('/products', { params });
  return data;
}

export async function getProductBySlug(slug: string) {
  const { data } = await api.get(`/products/${slug}`);
  return data.data;
}

export async function getFeaturedProducts() {
  const { data } = await api.get('/products/featured');
  return data.data;
}
