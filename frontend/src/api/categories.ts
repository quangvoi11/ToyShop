import api from './axios';

export async function getCategories() {
  const { data } = await api.get('/categories');
  return data.data;
}

export async function getCategoryBySlug(slug: string) {
  const { data } = await api.get(`/categories/${slug}`);
  return data.data;
}
