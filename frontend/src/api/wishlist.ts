import api from './axios';

export async function getWishlist() {
  const { data } = await api.get('/wishlist');
  return data.data;
}

export async function addToWishlist(productId: string) {
  const { data } = await api.post('/wishlist', { productId });
  return data.data;
}

export async function removeFromWishlist(productId: string) {
  const { data } = await api.delete(`/wishlist/${productId}`);
  return data.data;
}
