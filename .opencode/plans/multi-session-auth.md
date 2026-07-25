# Multi-Session Auth System — Implementation Plan

## Goal
Cho phép user đăng nhập đồng thời Customer + Admin trên cùng 1 browser, switch role instant không cần logout/login lại.

## Architecture Overview

```
localStorage (sau khi login cả 2):
{
  "auth_sessions": {
    "customer": { user, accessToken, refreshToken },
    "admin":    { user, accessToken, refreshToken }
  },
  "active_role": "customer",

  // Flat keys (synced from active session — backward compat for axios interceptor)
  "accessToken": "...",
  "refreshToken": "...",
  "user": { ... }
}
```

**Key insight**: Axios interceptor reads flat `localStorage.getItem('accessToken')`. Rather than rewriting the interceptor, we **sync the active session's tokens to flat keys** whenever the active role changes. This is a 3-line helper, zero risk of breaking API calls.

## Files to Modify (7 files)

---

### 1. `frontend/src/store/slices/authSlice.ts` — Core multi-session logic

**Changes:**

- Add to `AuthState`:
  ```ts
  sessions: Record<string, { user: User; accessToken: string; refreshToken: string }>;
  activeRole: string | null;
  ```

- **`loadSessions()` helper**: Read `auth_sessions` from localStorage. If not found, migrate from old flat keys (`accessToken`, `refreshToken`, `user`) — determines role from `user.role`. Returns `{ sessions, activeRole }`.

- **`syncFlatKeys(session)` helper**: Copy the active session's tokens/user to flat localStorage keys. Called after every session change.

- **`loginThunk.fulfilled`**: Instead of overwriting single tokens, store under `sessions[result.user.role]`. Set `activeRole = result.user.role`. Call `syncFlatKeys`.

- **`logout` reducer**: Remove only `sessions[activeRole]`. If sessions still has other roles, set `activeRole` to the remaining one (or `null` if empty). Call `syncFlatKeys` (or clear flat keys if no sessions left).

- **New reducer `switchSession(state, action)`**: Takes `role` payload. Verify `sessions[role]` exists. Set `activeRole = role`. Call `syncFlatKeys`.

- **New reducer `removeSession(state, action)`**: Takes `role` payload. Remove `sessions[role]`. If removed role was `activeRole`, switch to another or `null`. Call `syncFlatKeys`.

- **`fetchProfile.fulfilled`**: Update `sessions[activeRole].user`. Call `syncFlatKeys`.

- **Initial state**: Load from `loadSessions()`. Sync flat keys on startup.

---

### 2. `frontend/src/api/axios.ts` — 401 handler update

**Changes:**

- **Request interceptor** (line 8): Keep reading `localStorage.getItem('accessToken')` — sync pattern ensures flat keys are always current. **No change needed here.**

- **Response interceptor 401 handler** (line 45-48): Currently clears ALL flat keys and redirects to `/login`. Change to:
  - Read `auth_sessions` from localStorage
  - Remove only `sessions[active_role]`
  - Clear flat keys for the active session
  - If other sessions exist, switch to one (update `active_role`, sync flat keys), stay on page
  - If no sessions left, redirect to `/login`

---

### 3. `frontend/src/components/shared/Header.tsx` — Switch role UI

**Changes to the user dropdown (around line 97-130):**

- Read `sessions` and `activeRole` from Redux state
- If `Object.keys(sessions).length > 1`, show a "Chuyển tài khoản" section:
  ```
  ───────────────
  Chuyển tài khoản:
  👤 Customer (đang dùng)  ← grayed out
  🔐 Admin                 ← clickable
  ───────────────
  ```
- Each item shows: icon + role label + "(đang dùng)" if active
- Click dispatches `switchSession(role)` → instant swap
- Current "Quản trị" link (line 105-112): Remove — replaced by switch section
- Current "Đăng xuất" button: Dispatch `logout()` → removes only active session

---

### 4. `frontend/src/pages/Login.tsx` — No functional changes

The `handleSubmit` already dispatches `loginThunk` which will now store under `sessions[role]`. The redirect logic stays the same. **No changes needed.**

---

### 5. `frontend/src/pages/AdminLogin.tsx` — No functional changes

Same as Login.tsx. **No changes needed.**

---

### 6. `frontend/src/components/shared/ProtectedRoute.tsx` — Read from active session

**Current**: Reads `s.auth.accessToken` and `s.auth.user` (single session).
**New**: Read `s.auth.activeRole` + `s.auth.sessions[s.auth.activeRole]`:

```tsx
const { activeRole, sessions } = useSelector((s: RootState) => s.auth);
const activeSession = activeRole ? sessions[activeRole] : null;
const user = activeSession?.user ?? null;
const accessToken = activeSession?.accessToken ?? null;
```

Rest of the logic (presence check, role check) stays the same.

---

### 7. `frontend/src/features/admin/AdminLayout.tsx` — Smart redirect

**Current**: Unauthorized → redirect to `/admin/login`.
**New**: If customer session exists → show banner "Bạn đang đăng nhập với tài khoản Customer. [Chuyển sang Admin]" with button dispatching `switchSession('admin')`. If no sessions → redirect to `/admin/login`.

---

## Migration Strategy

On first load with new code:
1. `loadSessions()` checks if `auth_sessions` exists in localStorage
2. If NOT → reads old flat keys (`accessToken`, `refreshToken`, `user`)
3. If old keys exist → creates a session entry under `sessions[user.role]`
4. Sets `activeRole = user.role`
5. Saves `auth_sessions` to localStorage
6. Old flat keys remain (synced from active session)

Existing logged-in users don't get logged out.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Login customer → Login admin | Both sessions stored, switch via Header dropdown |
| Logout admin (while customer active) | Admin session removed, customer untouched |
| 401 on admin API → refresh fails | Admin session removed, switch to customer if available, else /login |
| Navigate to `/admin/*` without admin session | ProtectedRoute blocks → /admin/login |
| Switch to admin → token expired | 401 → refresh fails → remove admin session → auto-switch to customer |
| Only 1 session logged in | No switch UI, works exactly like before |
| localStorage cleared | All sessions lost (same as before) |

## Execution Order

1. **`authSlice.ts`** — Multi-session state, reducers, helpers (largest change)
2. **`ProtectedRoute.tsx`** — Read from active session
3. **`Header.tsx`** — Switch role UI
4. **`AdminLayout.tsx`** — Smart redirect
5. **`axios.ts`** — Update 401 handler
6. **Verify** Login.tsx + AdminLogin.tsx work (likely no changes)
7. **Manual test** — Login both roles, switch, verify API calls use correct token
