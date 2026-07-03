import api from './axios';

export async function getCart() {
  const { data } = await api.get('/cart');
  return data.data;
}

export async function addToCart(productId: string, quantity = 1) {
  const { data } = await api.post('/cart/items', { productId, quantity });
  return data.data;
}

export async function updateCartItem(itemId: string, quantity: number) {
  const { data } = await api.put(`/cart/items/${itemId}`, { quantity });
  return data.data;
}

export async function removeCartItem(itemId: string) {
  const { data } = await api.delete(`/cart/items/${itemId}`);
  return data.data;
}
