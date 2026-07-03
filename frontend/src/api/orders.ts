import api from './axios';

export async function createOrder(body: { addressId: string; paymentMethod: string; note?: string }) {
  const { data } = await api.post('/orders', body);
  return data.data;
}

export async function getMyOrders(page = 1) {
  const { data } = await api.get('/orders', { params: { page } });
  return data;
}

export async function getOrderById(id: string) {
  const { data } = await api.get(`/orders/${id}`);
  return data.data;
}
