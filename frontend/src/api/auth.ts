import api from './axios';

export async function login(email: string, password: string, portal: 'customer' | 'admin' = 'customer') {
  const { data } = await api.post('/auth/login', { email, password, portal });
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

export async function forgotPassword(email: string) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data.data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post('/auth/reset-password', { token, password });
  return data.data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
  return data.data;
}

export async function logout(refreshToken?: string) {
  const { data } = await api.post('/auth/logout', { refreshToken });
  return data.data;
}

export async function verifyEmail(token: string) {
  const { data } = await api.post('/auth/verify-email', { token });
  return data.data;
}

export async function resendVerification(email: string) {
  const { data } = await api.post('/auth/resend-verification', { email });
  return data.data;
}

export async function updateProfile(body: { firstName?: string; lastName?: string; phone: string; avatar?: string }) {
  const { data } = await api.patch('/auth/profile', body);
  return data.data;
}

export async function uploadAvatar(file: File) {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post('/upload/avatar', form, { params: { folder: 'toyshop/avatars' } });
  return data.data;
}
