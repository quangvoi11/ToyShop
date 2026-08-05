import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as authApi from '../../api/auth';
import type { RootState } from '../../store';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  emailVerifiedAt?: string | null;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

function migrateLegacyStorage(): void {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const userRaw = localStorage.getItem('user');
  if (accessToken && refreshToken && userRaw) return;

  const raw = localStorage.getItem('auth_sessions');
  if (!raw) return;
  try {
    const sessions = JSON.parse(raw);
    const roles = Object.keys(sessions);
    const first = roles[0] ? sessions[roles[0]] : null;
    if (first?.user && first?.accessToken && first?.refreshToken) {
      localStorage.setItem('accessToken', first.accessToken);
      localStorage.setItem('refreshToken', first.refreshToken);
      localStorage.setItem('user', JSON.stringify(first.user));
    }
  } catch {
    // ignore malformed storage
  }
  localStorage.removeItem('auth_sessions');
  localStorage.removeItem('active_role');
}

migrateLegacyStorage();

const storedAccessToken = localStorage.getItem('accessToken');
const storedRefreshToken = localStorage.getItem('refreshToken');
const storedUserRaw = localStorage.getItem('user');

function parseStoredUser(): User | null {
  if (!storedUserRaw) return null;
  try {
    return JSON.parse(storedUserRaw) as User;
  } catch {
    return null;
  }
}

const initialState: AuthState = {
  user: storedAccessToken && storedRefreshToken ? parseStoredUser() : null,
  accessToken: storedAccessToken && storedRefreshToken ? storedAccessToken : null,
  refreshToken: storedAccessToken && storedRefreshToken ? storedRefreshToken : null,
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (body: { email: string; password: string; portal: 'customer' | 'admin' }) => {
    return authApi.login(body.email, body.password, body.portal);
  },
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (body: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => {
    return authApi.register(body);
  },
);

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async () => {
  return authApi.getProfile();
});

export const logoutThunk = createAsyncThunk(
  'auth/logoutAsync',
  async (_arg: void, { dispatch, getState }) => {
    const state = getState() as RootState;
    const refreshToken = state.auth.refreshToken;
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // local logout still proceeds
      }
    }
    dispatch(logout());
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('auth_sessions');
      localStorage.removeItem('active_role');
    },
    clearError(state) {
      state.error = null;
    },
    tokenRefreshed(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        const { user, accessToken, refreshToken } = action.payload;
        state.user = user;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Đăng nhập thất bại';
      })
      .addCase(registerThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Đăng ký thất bại';
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      });
  },
});

export const { logout, clearError, tokenRefreshed } = authSlice.actions;
export default authSlice.reducer;
