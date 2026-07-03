import api from './axios';

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  return data.data;
}

export async function register(body: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  const { data } = await api.post('/auth/register', body);
  return data.data;
}

export async function getProfile() {
  const { data } = await api.get('/auth/me');
  return data.data;
}
