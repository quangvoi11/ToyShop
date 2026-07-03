import api from './axios';

export async function getAddresses() {
  const { data } = await api.get('/addresses');
  return data.data;
}

export async function createAddress(body: {
  label?: string;
  street: string;
  ward: string;
  district: string;
  city: string;
  phone: string;
  isDefault?: boolean;
}) {
  const { data } = await api.post('/addresses', body);
  return data.data;
}
