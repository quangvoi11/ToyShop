# Multi-Session Auth — Bug Fix Prompt

## Context
The multi-session auth system has been implemented. Code review found 1 bug and 2 minor improvements. This prompt covers fixing all 3.

## Bugs to Fix

### 1. 🔴 `ProtectedRoute` blocks AdminLayout's banner (Bug)

**File**: `frontend/src/App.tsx` (line 56)

**Problem**: `ProtectedRoute roles={['ADMIN']}` redirects non-admin users to `/` BEFORE `AdminLayout` can render its "Cần quyền Admin" banner with the "Chuyển sang Admin" button. The AdminLayout unauthorized UI is dead code.

**Fix**: Remove `roles` from the admin route's `ProtectedRoute`. Let `AdminLayout` handle the role check itself.

**Current code (App.tsx line 56):**
```tsx
<Route element={<ProtectedRoute roles={['ADMIN']} />}>
```

**New code:**
```tsx
<Route element={<ProtectedRoute />}>
```

That's it — one line change. `ProtectedRoute` will still check authentication (redirect to `/login` if not logged in), but won't check roles. `AdminLayout` already has its own role check at line ~145 (`if (!user || user.role !== 'ADMIN')`) and shows the switch banner.

---

### 2. 🟡 AdminLayout logout navigates to `/admin/login` (Minor)

**File**: `frontend/src/features/admin/AdminLayout.tsx` (line ~242)

**Problem**: After admin logout, `logout()` reducer switches to customer session (if exists). But `navigate('/admin/login')` sends user to admin login page while their active role is now customer. Confusing.

**Current code:**
```tsx
onClick={() => { dispatch(logout()); navigate('/admin/login'); }}
```

**New code:**
```tsx
onClick={() => {
  dispatch(logout());
  // After logout, check if another session exists
  const remaining = Object.keys(
    JSON.parse(localStorage.getItem('auth_sessions') || '{}')
  );
  navigate(remaining.length > 0 ? '/' : '/login');
}}
```

**Simpler alternative** (preferred — read from Redux after dispatch):

Since `logout()` updates Redux state synchronously, we can read the result:
```tsx
onClick={() => {
  dispatch(logout());
  // After logout, activeRole is updated by the reducer
  // If another session remains, go to home; otherwise go to login
  navigate('/');
}}
```

Actually, the simplest fix: always navigate to `/`. If user is logged out, `ProtectedRoute` on protected pages will redirect to `/login` anyway. And `/` is public, so it always works.

**Final new code:**
```tsx
onClick={() => { dispatch(logout()); navigate('/'); }}
```

---

### 3. 🟡 Switch session doesn't navigate (Minor)

**File**: `frontend/src/components/shared/Header.tsx` (line ~117)

**Problem**: User switches from admin to customer while on `/admin` page. Redux swaps session instantly, but user stays on `/admin` — which requires admin role. Now `AdminLayout` shows "Cần quyền Admin" banner (because active role is customer). Confusing UX.

**Current code:**
```tsx
onClick={() => { if (!isActive) dispatch(switchSession(role)); }}
```

**New code:**
```tsx
onClick={() => {
  if (!isActive) {
    dispatch(switchSession(role));
    navigate(role === 'admin' ? '/admin' : '/');
  }
}}
```

This navigates to the appropriate area after switch:
- Switch to admin → `/admin`
- Switch to customer → `/`

---

## Execution Order

1. **`App.tsx`** — Remove `roles={['ADMIN']}` from admin ProtectedRoute (1 line)
2. **`AdminLayout.tsx`** — Change logout navigate to `'/'` (1 line)
3. **`Header.tsx`** — Add `navigate()` after `switchSession()` (3 lines)

## Verification

After fixes, test these scenarios:
- [ ] Login as customer only → navigate to `/admin` → see "Cần quyền Admin" banner (not redirected to `/`)
- [ ] Click "Chuyển sang Admin" → if admin session exists, switch and see admin panel
- [ ] If no admin session, "Đăng nhập với tài khoản khác" link works
- [ ] Admin logout → navigated to `/` (not `/admin/login`)
- [ ] Header switch from admin to customer → navigated to `/`
- [ ] Header switch from customer to admin → navigated to `/admin`
- [ ] All existing functionality still works (login, register, cart, etc.)
