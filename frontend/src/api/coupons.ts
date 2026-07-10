import api from './axios';

export async function validateCoupon(code: string) {
  const { data } = await api.post('/coupons/validate', { code });
  return data.data;
}
