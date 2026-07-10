import api from './axios';

export async function getProductReviews(productId: string) {
  const { data } = await api.get(`/products/${productId}/reviews`);
  return data.data;
}

export async function createReview(productId: string, payload: { rating: number; title?: string; comment?: string }) {
  const { data } = await api.post(`/products/${productId}/reviews`, payload);
  return data.data;
}
