import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as authApi from '../../api/auth';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  sessions: Record<string, { user: User; accessToken: string; refreshToken: string }>;
  activeRole: string | null;
  loading: boolean;
  error: string | null;
}

function syncFlatKeys(session: { user: User; accessToken: string; refreshToken: string } | null) {
  if (session) {
    localStorage.setItem('accessToken', session.accessToken);
    localStorage.setItem('refreshToken', session.refreshToken);
    localStorage.setItem('user', JSON.stringify(session.user));
  } else {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}

function loadSessions(): { sessions: AuthState['sessions']; activeRole: string | null } {
  const raw = localStorage.getItem('auth_sessions');
  if (raw) {
    const sessions = JSON.parse(raw);
    const activeRole = localStorage.getItem('active_role') as string | null;
    if (activeRole && sessions[activeRole]) {
      return { sessions, activeRole };
    }
    const roles = Object.keys(sessions);
    return { sessions, activeRole: roles[0] ?? null };
  }

  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const userRaw = localStorage.getItem('user');
  if (accessToken && refreshToken && userRaw) {
    const user = JSON.parse(userRaw);
    const role = user.role?.toLowerCase() ?? 'customer';
    const sessions = { [role]: { user, accessToken, refreshToken } };
    localStorage.setItem('auth_sessions', JSON.stringify(sessions));
    localStorage.setItem('active_role', role);
    return { sessions, activeRole: role };
  }

  return { sessions: {}, activeRole: null };
}

const { sessions: initialSessions, activeRole: initialActiveRole } = loadSessions();
const activeSession = initialActiveRole ? initialSessions[initialActiveRole] : null;

const initialState: AuthState = {
  user: activeSession?.user ?? null,
  accessToken: activeSession?.accessToken ?? null,
  sessions: initialSessions,
  activeRole: initialActiveRole,
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (body: { email: string; password: string }) => {
    const result = await authApi.login(body.email, body.password);
    return result;
  },
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (body: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => {
    const result = await authApi.register(body);
    return result;
  },
);

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async () => {
  return authApi.getProfile();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      const role = state.activeRole;
      if (role && state.sessions[role]) {
        delete state.sessions[role];
      }

      const remainingRoles = Object.keys(state.sessions);
      state.activeRole = remainingRoles[0] ?? null;

      const newActive = state.activeRole ? state.sessions[state.activeRole] : null;
      state.user = newActive?.user ?? null;
      state.accessToken = newActive?.accessToken ?? null;

      localStorage.setItem('auth_sessions', JSON.stringify(state.sessions));
      if (state.activeRole) {
        localStorage.setItem('active_role', state.activeRole);
      } else {
        localStorage.removeItem('active_role');
      }
      syncFlatKeys(newActive);
    },
    clearError(state) {
      state.error = null;
    },
    switchSession(state, action: PayloadAction<string>) {
      const role = action.payload;
      if (!state.sessions[role]) return;

      state.activeRole = role;
      state.user = state.sessions[role].user;
      state.accessToken = state.sessions[role].accessToken;

      localStorage.setItem('active_role', role);
      syncFlatKeys(state.sessions[role]);
    },
    removeSession(state, action: PayloadAction<string>) {
      const role = action.payload;
      delete state.sessions[role];

      if (state.activeRole === role) {
        const remaining = Object.keys(state.sessions);
        state.activeRole = remaining[0] ?? null;
        const newActive = state.activeRole ? state.sessions[state.activeRole] : null;
        state.user = newActive?.user ?? null;
        state.accessToken = newActive?.accessToken ?? null;
        syncFlatKeys(newActive);
      }

      localStorage.setItem('auth_sessions', JSON.stringify(state.sessions));
      if (state.activeRole) {
        localStorage.setItem('active_role', state.activeRole);
      } else {
        localStorage.removeItem('active_role');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        const { user, accessToken, refreshToken } = action.payload;
        const role = user.role.toLowerCase();

        state.sessions[role] = { user, accessToken, refreshToken };
        state.activeRole = role;
        state.user = user;
        state.accessToken = accessToken;

        localStorage.setItem('auth_sessions', JSON.stringify(state.sessions));
        localStorage.setItem('active_role', role);
        syncFlatKeys(state.sessions[role]);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(registerThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.loading = false;
        const { user, accessToken, refreshToken } = action.payload;
        const role = user.role.toLowerCase();

        state.sessions[role] = { user, accessToken, refreshToken };
        state.activeRole = role;
        state.user = user;
        state.accessToken = accessToken;

        localStorage.setItem('auth_sessions', JSON.stringify(state.sessions));
        localStorage.setItem('active_role', role);
        syncFlatKeys(state.sessions[role]);
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        if (state.activeRole && state.sessions[state.activeRole]) {
          state.sessions[state.activeRole].user = action.payload;
          localStorage.setItem('auth_sessions', JSON.stringify(state.sessions));
          syncFlatKeys(state.sessions[state.activeRole]);
        }
      });
  },
});

export const { logout, clearError, switchSession, removeSession } = authSlice.actions;
export default authSlice.reducer;
