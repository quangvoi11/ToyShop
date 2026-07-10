import api from './axios';

export async function getAddresses() {
  const { data } = await api.get('/addresses');
  return data.data;
}

export async function getAddress(id: string) {
  const { data } = await api.get(`/addresses/${id}`);
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

export async function updateAddress(id: string, body: Partial<{
  label: string;
  street: string;
  ward: string;
  district: string;
  city: string;
  phone: string;
  isDefault: boolean;
}>) {
  const { data } = await api.put(`/addresses/${id}`, body);
  return data.data;
}

export async function deleteAddress(id: string) {
  const { data } = await api.delete(`/addresses/${id}`);
  return data.data;
}
