# Toast Notification System — Full Fix Execution Prompt

## Task
Add a centralized toast notification system to the ToyShop (Ele Store) frontend. Currently 56% of core user actions have NO success or error feedback. Add `sonner` toast library and apply to ALL core actions across customer and admin pages.

## Project Context
- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Redux Toolkit, TanStack Query
- No toast library currently installed
- Inconsistent notification patterns: `alert()`, inline banners, or silent failure
- Lint: `--max-warnings 0`, ~24 pre-existing `no-explicit-any` errors

## Step 1: Install sonner

```bash
npm install sonner
```

Run in `frontend/` directory.

---

## Step 2: Add `<Toaster />` to App

**File**: `frontend/src/App.tsx`

Add import at top:
```tsx
import { Toaster } from 'sonner';
```

Add `<Toaster />` inside the `<Routes>` component, as the first child:
```tsx
export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        {/* ... existing routes ... */}
      </Routes>
    </>
  );
}
```

Note: Currently App returns `<Routes>` directly. Wrap in `<>...</>` fragment to add Toaster.

---

## Step 3: Customer Pages — Add Toast Notifications

### 3a. `frontend/src/pages/ProductDetail.tsx`

**Already has**: Cart error display, "Đã thêm ✓" button text, review error display.

**Add**:
- Wishlist add success: `toast.success('Đã thêm vào yêu thích')`
- Wishlist remove success: `toast.success('Đã xóa khỏi yêu thích')`
- Wishlist error: `toast.error('Không thể cập nhật yêu thích')`
- Review success: `toast.success('Đã gửi đánh giá')`

**Changes**:

Add import:
```tsx
import { toast } from 'sonner';
```

Update `addWishMut`:
```tsx
const addWishMut = useMutation({
  mutationFn: () => addToWishlist(product!.id),
  onSuccess: () => {
    setWished(true);
    queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    toast.success('Đã thêm vào yêu thích');
  },
  onError: () => {
    toast.error('Không thể thêm vào yêu thích');
  },
});
```

Update `removeWishMut`:
```tsx
const removeWishMut = useMutation({
  mutationFn: () => removeFromWishlist(product!.id),
  onSuccess: () => {
    setWished(false);
    queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    toast.success('Đã xóa khỏi yêu thích');
  },
  onError: () => {
    toast.error('Không thể xóa khỏi yêu thích');
  },
});
```

Update `reviewMut`:
```tsx
const reviewMut = useMutation({
  mutationFn: () => createReview(product!.id, { rating: reviewRating, comment: reviewComment }),
  onSuccess: () => {
    setReviewComment('');
    setReviewRating(5);
    refetchReviews();
    queryClient.invalidateQueries({ queryKey: ['product', slug] });
    toast.success('Đã gửi đánh giá');
  },
  onError: (err) => {
    toast.error((err as Error).message || 'Không thể gửi đánh giá');
  },
});
```

---

### 3b. `frontend/src/pages/Cart.tsx`

**Currently has**: NO feedback for update/remove actions.

**Add**:
- Update quantity success: no toast needed (instant UI update is fine)
- Update quantity error: `toast.error(message)` — show backend error (stock insufficient)
- Remove item success: `toast.success('Đã xóa sản phẩm khỏi giỏ hàng')`
- Remove item error: `toast.error('Không thể xóa sản phẩm')`

**Changes**:

Add import:
```tsx
import { toast } from 'sonner';
```

The `updateCartItemThunk` and `removeCartItemThunk` are Redux async thunks. They don't expose errors to the component easily. Two approaches:

**Approach A (Recommended)**: Convert the dispatch calls to handle errors via `.unwrap()`:

For the "+" button (line 98-104), wrap in try/catch:
```tsx
onClick={async () => {
  try {
    await dispatch(updateCartItemThunk({ itemId: item.id, quantity: item.quantity + 1 })).unwrap();
  } catch (err) {
    toast.error((err as { message?: string })?.message || 'Không thể cập nhật số lượng');
  }
}}
```

For the "-" button (line 84-90), same pattern:
```tsx
onClick={async () => {
  try {
    await dispatch(updateCartItemThunk({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })).unwrap();
  } catch (err) {
    toast.error((err as { message?: string })?.message || 'Không thể cập nhật số lượng');
  }
}}
```

For the delete button (line 125-129):
```tsx
onClick={async () => {
  try {
    await dispatch(removeCartItemThunk(item.id)).unwrap();
    toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
  } catch {
    toast.error('Không thể xóa sản phẩm');
  }
}}
```

---

### 3c. `frontend/src/pages/Checkout.tsx`

**Already has**: Order error display, coupon error display.

**Add**:
- Address creation success: `toast.success('Đã lưu địa chỉ')`
- Address creation error: `toast.error(message)` instead of `console.error`

**Changes**:

Add import:
```tsx
import { toast } from 'sonner';
```

Update `handleSubmitAddress` catch (line 97-99):
```tsx
} catch (err) {
  const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể lưu địa chỉ';
  toast.error(message);
}
```

Add success toast after address creation:
```tsx
const handleSubmitAddress = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const addr = await createAddress(addressForm);
    setSelectedAddress(addr.id);
    setShowAddressForm(false);
    refetchAddresses();
    toast.success('Đã lưu địa chỉ');
  } catch (err) {
    // ... error handling above
  }
};
```

---

### 3d. `frontend/src/pages/Wishlist.tsx`

**Currently has**: NO feedback for remove action. Add-to-cart from wishlist has no feedback.

**Add**:
- Remove success: `toast.success('Đã xóa khỏi yêu thích')`
- Remove error: `toast.error('Không thể xóa khỏi yêu thích')`
- Add to cart success: `toast.success('Đã thêm vào giỏ hàng')`
- Add to cart error: `toast.error(message)` — show backend error

**Changes**:

Add import:
```tsx
import { toast } from 'sonner';
```

Update `removeMut`:
```tsx
const removeMut = useMutation({
  mutationFn: removeFromWishlist,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    toast.success('Đã xóa khỏi yêu thích');
  },
  onError: () => {
    toast.error('Không thể xóa khỏi yêu thích');
  },
});
```

For "Thêm giỏ" button (line 76), the current code uses `store.dispatch()` directly. Change to handle error:

Replace the onClick handler:
```tsx
onClick={async () => {
  try {
    await store.dispatch(addToCartThunk({ productId: item.productId, quantity: 1 })).unwrap();
    toast.success('Đã thêm vào giỏ hàng');
  } catch (err) {
    toast.error((err as { message?: string })?.message || 'Không thể thêm vào giỏ hàng');
  }
}}
```

---

### 3e. `frontend/src/pages/OrderDetail.tsx`

**Currently has**: NO feedback for cancel or retry payment.

**Add**:
- Cancel success: `toast.success('Đã hủy đơn hàng')`
- Cancel error: `toast.error(message)`
- Retry payment success: no toast (redirects to VNPay)
- Retry payment error: `toast.error('Không thể tạo link thanh toán')`

**Changes**:

Add import:
```tsx
import { toast } from 'sonner';
```

Update `cancelMut`:
```tsx
const cancelMut = useMutation({
  mutationFn: () => cancelOrder(id!),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['order', id] });
    toast.success('Đã hủy đơn hàng');
  },
  onError: (err) => {
    toast.error((err as Error).message || 'Không thể hủy đơn hàng');
  },
});
```

Update `retryPaymentMut`:
```tsx
const retryPaymentMut = useMutation({
  mutationFn: () => retryPayment(id!),
  onSuccess: (data) => {
    if (data.paymentUrl) {
      window.location.href = data.paymentUrl;
    }
  },
  onError: () => {
    toast.error('Không thể tạo link thanh toán');
  },
});
```

---

### 3f. `frontend/src/pages/Addresses.tsx`

**Read the file first** to understand current patterns, then add:
- Create address success: `toast.success('Đã thêm địa chỉ')`
- Create address error: `toast.error(message)`
- Update address success: `toast.success('Đã cập nhật địa chỉ')`
- Update address error: `toast.error(message)`
- Delete address success: `toast.success('Đã xóa địa chỉ')`
- Delete address error: `toast.error(message)`
- Set default success: `toast.success('Đã đặt làm địa chỉ mặc định')`

---

## Step 4: Admin Pages — Replace alert() with Toast

### 4a. `frontend/src/features/admin/AdminProducts.tsx`

**Replace all `alert()` calls with `toast.error()`**:
- Line ~130: `alert(...)` → `toast.error(...)`
- Line ~141: `alert(...)` → `toast.error(...)`
- Line ~151: `alert(...)` → `toast.error(...)`
- Line ~213-217: `alert(...)` → `toast.error(...)`

**Add success toasts**:
- Product create success: `toast.success('Đã tạo sản phẩm')`
- Product update success: `toast.success('Đã cập nhật sản phẩm')`
- Product delete success: `toast.success('Đã xóa sản phẩm')`
- Image upload success: `toast.success('Đã tải ảnh lên')`
- Image upload error (line ~185-189): `toast.error('Tải ảnh thất bại')`

**Changes**:

Add import:
```tsx
import { toast } from 'sonner';
```

Then replace every `alert(...)` with `toast.error(...)` and add `toast.success(...)` in `onSuccess` handlers.

---

### 4b. `frontend/src/features/admin/AdminOrders.tsx`

**Currently has**: NO feedback for status/payment changes.

**Add**:
- Status change success: `toast.success('Đã cập nhật trạng thái')`
- Status change error: `toast.error(message)`
- Payment status change success: `toast.success('Đã cập nhật thanh toán')`
- Payment status change error: `toast.error(message)`
- Cancel order success: `toast.success('Đã hủy đơn hàng')`
- Cancel order error: `toast.error(message)`

**Changes**:

Add import:
```tsx
import { toast } from 'sonner';
```

Update `statusMut`:
```tsx
const statusMut = useMutation({
  mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
    api.patch(`/admin/orders/${orderId}/status`, { status }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    setSelectedOrder(null);
    toast.success('Đã cập nhật trạng thái');
  },
  onError: (err) => {
    toast.error((err as Error).message || 'Không thể cập nhật trạng thái');
  },
});
```

Update `paymentMut`:
```tsx
const paymentMut = useMutation({
  mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
    api.patch(`/admin/orders/${orderId}/payment-status`, { paymentStatus: status }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    setSelectedOrder(null);
    toast.success('Đã cập nhật thanh toán');
  },
  onError: (err) => {
    toast.error((err as Error).message || 'Không thể cập nhật thanh toán');
  },
});
```

Update cancel mutation similarly.

---

### 4c. `frontend/src/features/admin/AdminUsers.tsx`

**Currently has**: NO feedback for status/role changes.

**Add**:
- Status change success: `toast.success('Đã cập nhật trạng thái')`
- Status change error: `toast.error(message)`
- Role change success: `toast.success('Đã cập nhật vai trò')`
- Role change error: `toast.error(message)`

**Changes**:

Add import and add `onSuccess`/`onError` to both `statusMut` and `roleMut`.

---

### 4d. `frontend/src/features/admin/AdminCoupons.tsx`

**Already has**: Inline error banner in modal.

**Add**:
- Create success: `toast.success('Đã tạo mã giảm giá')`
- Update success: `toast.success('Đã cập nhật mã giảm giá')`
- Delete success: `toast.success('Đã xóa mã giảm giá')`
- Delete error: `toast.error(message)`

**Changes**:

Add import and add `toast.success()` in `onSuccess` handlers. Add `onError` to `deleteMut`.

---

### 4e. `frontend/src/features/admin/AdminCategories.tsx`

**Replace all `alert()` calls with `toast.error()`**:
- Line ~123: create error
- Line ~136: update error
- Line ~148: delete error
- Line ~161: image upload error
- Line ~168: validation error

**Add success toasts**:
- Create success: `toast.success('Đã tạo danh mục')`
- Update success: `toast.success('Đã cập nhật danh mục')`
- Delete success: `toast.success('Đã xóa danh mục')`
- Image upload success: `toast.success('Đã tải ảnh lên')`

---

## Step 5: Auth Pages (Already OK — minimal changes)

### Login.tsx, Register.tsx, ForgotPassword.tsx, ResetPassword.tsx
These already have inline error banners. **No changes needed** — they work well as-is.

---

## Files to Modify (14 files)

| # | File | Changes |
|---|------|---------|
| 1 | `App.tsx` | Add `<Toaster />` import + component |
| 2 | `ProductDetail.tsx` | Add wishlist + review toasts |
| 3 | `Cart.tsx` | Add update/remove error toasts |
| 4 | `Checkout.tsx` | Add address creation toasts |
| 5 | `Wishlist.tsx` | Add remove + add-to-cart toasts |
| 6 | `OrderDetail.tsx` | Add cancel + retry payment toasts |
| 7 | `Addresses.tsx` | Add CRUD toasts |
| 8 | `AdminProducts.tsx` | Replace alert() with toast, add success |
| 9 | `AdminOrders.tsx` | Add status/payment change toasts |
| 10 | `AdminUsers.tsx` | Add status/role change toasts |
| 11 | `AdminCoupons.tsx` | Add success toasts, delete error |
| 12 | `AdminCategories.tsx` | Replace alert() with toast, add success |

## Execution Order

1. **Install sonner** — `npm install sonner`
2. **App.tsx** — Add `<Toaster />`
3. **Customer pages** (6 files) — Add toast imports + notifications
4. **Admin pages** (5 files) — Replace alert() + add missing notifications
5. **Verify** — `npm run lint` + `npx tsc --noEmit`

## Verification

After all changes:
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] No `alert()` calls remaining in any file
- [ ] No `console.error(err)` as only error handling
- [ ] All core actions have either success toast or error toast (or both)
- [ ] Toast appears top-right, auto-dismisses after 3 seconds
- [ ] Toast has close button

## Important Notes

- **Run `npm run lint` in frontend directory after all changes** — `--max-warnings 0`
- **Do NOT add `any` type** — use `(err as { message?: string })` or `(err as Error)` patterns
- **`sonner` toast is non-blocking** — unlike `alert()`, it doesn't freeze the UI
- **Keep existing inline error banners** where they exist (Checkout, Register) — toast is supplementary, not replacement
- **Backend error messages are in Vietnamese** — toast messages should also be Vietnamese
- **`sonner` is ~3KB gzipped** — minimal bundle impact
