# Multi-Session Auth — Execution Prompt

## Task
Implement a multi-session authentication system for the ToyShop (Ele Store) frontend. Users can be logged in as both Customer and Admin simultaneously in the same browser, and switch roles instantly without logout/login.

## Project Context
- Monorepo: `@toyshop/frontend` (React 18, Vite, TypeScript, Redux Toolkit, Tailwind CSS)
- Auth state: `frontend/src/store/slices/authSlice.ts`
- API layer: `frontend/src/api/axios.ts` (reads flat `localStorage.getItem('accessToken')` in request interceptor)
- Routing: `frontend/src/App.tsx` — customer routes under `/`, admin routes under `/admin`, admin login at `/admin/login`
- Current behavior: Single session only — login overwrites previous tokens, logout clears everything

## Architecture

### localStorage Structure
```ts
// Multi-session store (NEW)
"auth_sessions": {
  "customer": { user: User, accessToken: string, refreshToken: string },
  "admin":    { user: User, accessToken: string, refreshToken: string }
}
"active_role": "customer" | "admin"

// Flat keys (synced from active session — backward compat for axios interceptor)
"accessToken": "..."
"refreshToken": "..."
"user": { ... }
```

### Key Design Decision
Axios interceptor (`axios.ts:8`) reads `localStorage.getItem('accessToken')` directly. Instead of refactoring the interceptor to read from Redux (circular dependency risk), we **sync the active session's tokens to flat localStorage keys** after every session change. This is a 3-line helper function.

## Files to Modify (5 files)

### 1. `frontend/src/store/slices/authSlice.ts` — Core multi-session logic

**Add to AuthState interface:**
```ts
sessions: Record<string, { user: User; accessToken: string; refreshToken: string }>;
activeRole: string | null;
```

**Add helpers:**
```ts
// Sync active session tokens to flat localStorage keys (for axios interceptor)
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

// Load sessions from localStorage, migrate from old flat keys if needed
function loadSessions(): { sessions: AuthState['sessions']; activeRole: string | null } {
  const raw = localStorage.getItem('auth_sessions');
  if (raw) {
    const sessions = JSON.parse(raw);
    const activeRole = localStorage.getItem('active_role') as string | null;
    // Verify activeRole is valid
    if (activeRole && sessions[activeRole]) {
      return { sessions, activeRole };
    }
    // Pick first available role
    const roles = Object.keys(sessions);
    return { sessions, activeRole: roles[0] ?? null };
  }

  // Migration: read old flat keys
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
```

**Modify initialState:**
```ts
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
```

**Modify loginThunk.fulfilled:**
```ts
.addCase(loginThunk.fulfilled, (state, action) => {
  state.loading = false;
  const { user, accessToken, refreshToken } = action.payload;
  const role = user.role.toLowerCase();
  
  // Store session by role
  state.sessions[role] = { user, accessToken, refreshToken };
  state.activeRole = role;
  
  // Update flat state (for components reading state.user/accessToken directly)
  state.user = user;
  state.accessToken = accessToken;
  
  // Sync to localStorage
  localStorage.setItem('auth_sessions', JSON.stringify(state.sessions));
  localStorage.setItem('active_role', role);
  syncFlatKeys(state.sessions[role]);
})
```

**Modify logout reducer:**
```ts
logout(state) {
  const role = state.activeRole;
  if (role && state.sessions[role]) {
    delete state.sessions[role];
  }
  
  // Switch to another session if available
  const remainingRoles = Object.keys(state.sessions);
  state.activeRole = remainingRoles[0] ?? null;
  
  const newActive = state.activeRole ? state.sessions[state.activeRole] : null;
  state.user = newActive?.user ?? null;
  state.accessToken = newActive?.accessToken ?? null;
  
  // Sync localStorage
  localStorage.setItem('auth_sessions', JSON.stringify(state.sessions));
  if (state.activeRole) {
    localStorage.setItem('active_role', state.activeRole);
  } else {
    localStorage.removeItem('active_role');
  }
  syncFlatKeys(newActive);
}
```

**Add new reducers:**
```ts
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
```

**Modify fetchProfile.fulfilled:**
```ts
.addCase(fetchProfile.fulfilled, (state, action) => {
  state.user = action.payload;
  if (state.activeRole && state.sessions[state.activeRole]) {
    state.sessions[state.activeRole].user = action.payload;
    localStorage.setItem('auth_sessions', JSON.stringify(state.sessions));
    syncFlatKeys(state.sessions[state.activeRole]);
  }
})
```

**Export new actions:**
```ts
export const { logout, clearError, switchSession, removeSession } = authSlice.actions;
```

---

### 2. `frontend/src/components/shared/ProtectedRoute.tsx` — Read from active session

**Replace current logic:**
```tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface ProtectedRouteProps {
  roles?: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({ roles, redirectTo = '/login' }: ProtectedRouteProps) {
  const { activeRole, sessions } = useSelector((s: RootState) => s.auth);
  const location = useLocation();

  const activeSession = activeRole ? sessions[activeRole] : null;
  const user = activeSession?.user ?? null;
  const accessToken = activeSession?.accessToken ?? null;

  if (!accessToken || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
```

---

### 3. `frontend/src/components/shared/Header.tsx` — Switch role UI

**Add import:**
```tsx
import { switchSession } from '../../store/slices/authSlice';
```

**Read sessions from Redux (replace line ~24):**
```tsx
const { user, accessToken, sessions, activeRole } = useAppSelector((s) => s.auth);
const sessionRoles = Object.keys(sessions);
const hasMultipleSessions = sessionRoles.length > 1;
```

**Replace the user dropdown (lines ~97-130) with:**
```tsx
{accessToken ? (
  <div className="group relative">
    <button className="flex items-center gap-1 rounded-lg p-2 hover:bg-gray-100">
      <User className="h-5 w-5" />
      <span className="hidden text-sm md:inline">{user?.firstName}</span>
    </button>
    <div className="invisible absolute right-0 top-full z-50 w-56 rounded-lg border bg-white py-2 shadow-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100">
      {/* Account info */}
      <div className="px-4 py-2 border-b">
        <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
        <p className="text-xs text-gray-500">{user?.email}</p>
      </div>

      {/* Switch role section — only show if multiple sessions */}
      {hasMultipleSessions && (
        <>
          <div className="px-4 py-1.5">
            <p className="text-xs font-medium text-gray-400 uppercase">Chuyển tài khoản</p>
          </div>
          {sessionRoles.map((role) => {
            const session = sessions[role];
            const isActive = role === activeRole;
            return (
              <button
                key={role}
                onClick={() => {
                  if (!isActive) dispatch(switchSession(role));
                }}
                className={`flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 ${
                  isActive ? 'bg-gray-50 text-gray-400 cursor-default' : ''
                }`}
              >
                <span>{role === 'admin' ? '🔐' : '👤'}</span>
                <span>{session.user.firstName} ({role === 'admin' ? 'Admin' : 'Customer'})</span>
                {isActive && <span className="ml-auto text-xs text-gray-400">đang dùng</span>}
              </button>
            );
          })}
          <hr className="my-1" />
        </>
      )}

      {/* Navigation links */}
      {user?.role === 'ADMIN' && !hasMultipleSessions && (
        <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-gray-50 text-blue-600 font-medium">
          Quản trị
        </Link>
      )}
      <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-gray-50">
        Tài khoản
      </Link>
      <Link to="/orders" className="block px-4 py-2 text-sm hover:bg-gray-50">
        Đơn hàng
      </Link>
      <Link to="/wishlist" className="block px-4 py-2 text-sm hover:bg-gray-50">
        Yêu thích
      </Link>
      <hr className="my-1" />
      <button
        onClick={() => {
          dispatch(logout());
          navigate('/');
        }}
        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
      >
        Đăng xuất
      </button>
    </div>
  </div>
) : (
  <Link to="/login" className="flex items-center gap-1 rounded-lg p-2 hover:bg-gray-100">
    <User className="h-5 w-5" />
    <span className="hidden text-sm md:inline">Đăng nhập</span>
  </Link>
)}
```

---

### 4. `frontend/src/features/admin/AdminLayout.tsx` — Smart redirect

**Add imports:**
```tsx
import { useAppSelector, useAppDispatch } from '../../store';
import { switchSession } from '../../store/slices/authSlice';
```

**Replace the unauthorized redirect logic.** Currently the file has a `useEffect` or conditional that redirects to `/admin/login` when not authenticated. Change it to:

```tsx
const { activeRole, sessions } = useAppSelector((s) => s.auth);
const dispatch = useAppDispatch();
const hasCustomerSession = !!sessions['customer'];

// In the unauthorized state (where it currently redirects to /admin/login):
// Show a prompt instead:
if (!accessToken || !user || user.role !== 'ADMIN') {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="rounded-xl bg-white p-8 shadow-lg text-center max-w-md">
        <img src="/images/logo-admin.png" alt="Ele Store" className="mx-auto h-12 w-auto mb-4" />
        <h2 className="text-lg font-bold mb-2">Cần quyền Admin</h2>
        <p className="text-sm text-gray-500 mb-6">
          Bạn đang đăng nhập với tài khoản Customer.
        </p>
        {hasCustomerSession && (
          <button
            onClick={() => dispatch(switchSession('admin'))}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 mb-3"
          >
            Chuyển sang Admin
          </button>
        )}
        <Link to="/login" className="block text-sm text-blue-600 hover:underline">
          Đăng nhập lại với tài khoản khác
        </Link>
      </div>
    </div>
  );
}
```

Note: The exact implementation depends on how the current `AdminLayout.tsx` handles the unauthorized case. Read the file first and adapt accordingly. The key change is: instead of `Navigate to="/admin/login"`, show a banner with a "Chuyển sang Admin" button when customer session exists.

---

### 5. `frontend/src/api/axios.ts` — Update 401 handler

**Replace the 401 error handler (lines ~44-49):**
```ts
} catch {
  refreshPromise = null;
  
  // Multi-session: remove only the failed session
  try {
    const sessionsRaw = localStorage.getItem('auth_sessions');
    const activeRole = localStorage.getItem('active_role');
    if (sessionsRaw && activeRole) {
      const sessions = JSON.parse(sessionsRaw);
      delete sessions[activeRole];
      
      const remaining = Object.keys(sessions);
      if (remaining.length > 0) {
        // Switch to another session
        const newRole = remaining[0];
        localStorage.setItem('auth_sessions', JSON.stringify(sessions));
        localStorage.setItem('active_role', newRole);
        localStorage.setItem('accessToken', sessions[newRole].accessToken);
        localStorage.setItem('refreshToken', sessions[newRole].refreshToken);
        localStorage.setItem('user', JSON.stringify(sessions[newRole].user));
        // Don't redirect — let the app continue with the other session
        return Promise.reject(error);
      }
    }
  } catch {
    // Fall through to full logout
  }
  
  // No sessions left — full cleanup
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('auth_sessions');
  localStorage.removeItem('active_role');
  window.location.href = '/login';
  return Promise.reject(error);
}
```

---

## Execution Order

1. **`authSlice.ts`** — All state/reducer/helper changes (largest file, most critical)
2. **`ProtectedRoute.tsx`** — Quick change to read from active session
3. **`Header.tsx`** — Add switch role UI in dropdown
4. **`AdminLayout.tsx`** — Smart redirect with "Chuyển sang Admin" banner
5. **`axios.ts`** — Update 401 handler for multi-session cleanup

## Testing Checklist

After implementation, manually verify:

- [ ] Login as customer → Header shows customer name
- [ ] Login as admin (separately, e.g. via /admin/login) → both sessions stored in localStorage
- [ ] Header dropdown shows "Chuyển tài khoản" section with both roles
- [ ] Click "Admin" → instant switch, admin panel accessible, API calls use admin token
- [ ] Click "Customer" → instant switch, customer pages work, API calls use customer token
- [ ] Logout admin → admin session removed, customer session untouched
- [ ] Logout customer → customer session removed, admin session untouched (if exists)
- [ ] Logout all → redirect to /login
- [ ] Open /admin without admin session → shows "Cần quyền Admin" banner
- [ ] Token expires → 401 handler removes only that session, switches to other if available
- [ ] Page refresh → sessions persist from localStorage, correct active session restored
- [ ] Old users (no auth_sessions in localStorage) → migration from flat keys works

## Important Notes

- **Do NOT modify `Login.tsx` or `AdminLogin.tsx`** — they dispatch `loginThunk` which the slice now handles correctly
- **Do NOT change the axios request interceptor** — flat key sync ensures it works as-is
- **Keep `state.user` and `state.accessToken` in sync** — some components read these directly; they should reflect the active session
- **`localStorage` is the source of truth** for persistence; Redux state is rebuilt from it on page load
- **Run `npm run lint` in frontend directory** after changes — the project has `--max-warnings 0` and ~24 pre-existing `no-explicit-any` errors; don't add more
