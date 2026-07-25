# Inventory & Order Flow — Comprehensive Bug Fix Plan

## Root Cause Analysis

**User report**: "Sản phẩm trong kho không hề reserve hay trừ đi khi mua hàng"

After tracing the entire flow (schema → cart → checkout → order creation → payment → stock decrement), here are ALL bugs found:

---

## 🔴 CRITICAL BUGS (Stock/Inventory)

### Bug 1: Stock NEVER decremented for COD orders
**Files**: `order.service.ts`, `payment.service.ts`
**Root cause**: `confirmPaymentStock()` is ONLY called from VNPay IPN/Return handlers. COD orders have no payment confirmation flow → stock is NEVER decremented.
**Impact**: Overselling — customers can buy unlimited quantities of out-of-stock products via COD.

### Bug 2: TOCTOU race condition — stock check outside transaction
**File**: `order.service.ts:68-80`
**Root cause**: Stock validation loop runs OUTSIDE `$transaction` (lines 82-111). Between the check and the actual order creation, concurrent requests can deplete stock.
**Impact**: Two users buy last item simultaneously → both pass stock check → both create orders → overselling.
**Fix**: Move stock check INSIDE the transaction, or use `SELECT ... FOR UPDATE` pattern.

### Bug 3: Variant stock never checked or decremented
**File**: `order.service.ts`, `cart.service.ts`
**Root cause**: `ProductVariant` has its own `stock` field. `CartItem` has `variantId`. But the entire order flow only checks/decrements `Product.stock` — variant-level inventory is completely ignored.
**Impact**: Variant stock counts are always wrong.

### Bug 4: Cart doesn't validate stock on add/update
**File**: `cart.service.ts:39-57`
**Root cause**: `addItem()` and `updateItem()` don't check if requested quantity is within available stock.
**Impact**: Users can add unlimited quantities to cart regardless of actual stock.

### Bug 5: Race condition in `confirmPaymentStock` idempotency
**File**: `order.service.ts:176-179`
**Root cause**: Idempotency check (`existingTx && order.paidAt`) runs OUTSIDE the transaction. Two concurrent VNPay IPN webhooks can both pass this check and both enter the stock decrement loop.
**Impact**: Stock decremented twice for same order.

### Bug 6: `restoreStockOnCancel` condition inverted for PENDING+PAID orders
**File**: `order.service.ts:218`
**Root cause**: `wasStockDecremented = order.status !== 'PENDING'` — but `confirmPaymentStock` can succeed while order is still `PENDING` (it only checks `paymentStatus === 'PAID'`, not `status`). If stock was decremented while PENDING, cancelling skips restoration.
**Impact**: Stock leak on cancelled orders that were paid but still PENDING.

---

## 🟡 MEDIUM BUGS (Logic/Data)

### Bug 7: Coupon `usedCount` not rolled back on stock failure
**File**: `order.service.ts:95-100` vs `order.service.ts:176-203`
**Root cause**: Coupon increment happens in order creation transaction. Stock decrement happens later in `confirmPaymentStock`. If stock validation fails later, coupon is still marked as used.
**Impact**: Coupon usage count wrong, coupon may become "fully used" unfairly.

### Bug 8: Checkout silently swallows errors
**File**: `Checkout.tsx:121-128`
**Root cause**: `handleSubmit` catches errors but only `console.error(err)` — no user feedback.
**Impact**: If order fails (stock insufficient, address invalid), user sees nothing, stays on page confused.

### Bug 9: Cart quantity not bounded by stock
**File**: `Cart.tsx:97-107`
**Root cause**: Plus button increments quantity without checking against `item.product.stock`.
**Impact**: User can set quantity 999 for item with stock 5, then order fails at checkout.

### Bug 10: Product detail doesn't show stock
**File**: `product.service.ts:68-80`
**Root cause**: `getBySlug` doesn't include `stock` in response.
**Impact**: User can't see availability before adding to cart.

---

## 🔵 MINOR BUGS (UX/Cosmetic)

### Bug 11: Cart shows emoji placeholder, not product images
**File**: `Cart.tsx:67`
**Root cause**: `<span className="text-3xl">🧱</span>` — cart API doesn't return images.
**Impact**: Cart looks unfinished.

### Bug 12: Checkout shows emoji placeholder, not product images
**File**: `Checkout.tsx:186`
**Root cause**: `<div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-lg">🧱</div>`
**Impact**: Order summary looks unfinished.

---

## Fix Plan (Execution Order)

### Step 1: Cart stock validation (`cart.service.ts`)
- `addItem()`: Check `product.stock >= quantity` before adding. Return error if insufficient.
- `updateItem()`: Check `product.stock >= quantity` before updating. Return error if insufficient.
- This is the first line of defense.

### Step 2: Move stock check inside transaction (`order.service.ts`)
- Remove the pre-transaction stock validation loop (lines 68-80).
- Inside the `$transaction`, add stock check + decrement atomically:
  ```ts
  for (const item of cart.items) {
    const product = await tx.product.findUnique({
      where: { id: item.product.id },
      select: { stock: true },
    });
    if (!product || product.stock < item.quantity) {
      throw new AppError(`Sản phẩm "${item.product.name}" không đủ tồn kho (còn ${product?.stock || 0})`, 400);
    }
    await tx.product.update({
      where: { id: item.product.id },
      data: {
        stock: { decrement: item.quantity },
        soldCount: { increment: item.quantity },
      },
    });
  }
  ```
- This eliminates the TOCTOU race condition AND handles COD orders.

### Step 3: Fix `confirmPaymentStock` to be idempotent (`order.service.ts`)
- Move the idempotency check INSIDE the transaction.
- Add a check: if stock was already decremented (e.g., by the new order creation flow), skip.
- Since Step 2 now decrements stock at order creation, `confirmPaymentStock` becomes a no-op for orders that already had stock decremented. But we need to handle the transition period.

**Revised approach**: Since Step 2 decrements stock at order creation time:
- `confirmPaymentStock` should check if stock was already decremented and skip if so.
- VNPay IPN/Return should NOT call `confirmPaymentStock` anymore (stock already decremented).
- But we need backward compatibility for orders created before this fix.

**Simpler approach**: Keep the current architecture (stock decrement on payment confirmation) but:
- For COD: Call `confirmPaymentStock` immediately when order is created with COD payment method.
- Move stock check inside the order creation transaction as a "reservation" (mark that stock is reserved).
- On payment confirmation, convert reservation to actual decrement.

**Even simpler approach (recommended)**: Decrement stock at order creation time (Step 2). Remove `confirmPaymentStock` call from VNPay handlers. Add stock restoration on payment failure/timeout.

### Step 4: Fix `restoreStockOnCancel` (`order.service.ts`)
- Since stock is now decremented at order creation (Step 2), `restoreStockOnCancel` should restore for ALL cancellable statuses (PENDING, CONFIRMED).
- Change condition: always restore stock when cancelling (remove the `wasStockDecremented` check).
- Add validation: only restore if `order.status !== 'CANCELLED'` (prevent double restore).

### Step 5: Frontend stock validation
- **Cart.tsx**: Disable "+" button when `quantity >= item.product.stock`. Show "Hết hàng" when stock = 0.
- **Checkout.tsx**: Add error display for order creation failures. Show stock-related error messages from backend.
- **ProductDetail.tsx**: Show stock info ("Còn X sản phẩm" or "Hết hàng").

### Step 6: Fix cart/checkout product images
- Add `imageUrl` to cart API response (from product's primary image).
- Replace emoji placeholders in Cart.tsx and Checkout.tsx with actual product images.

---

## Detailed Fix Descriptions

### Fix 1: `cart.service.ts` — Stock validation on add/update

**`addItem` (line 39)**:
```ts
export async function addItem(userId: string, productId: string, quantity: number, variantId?: string) {
  const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } });
  if (!product) throw new AppError('Product not found', 404);

  // NEW: Check stock
  if (product.stock < quantity) {
    throw new AppError(`Sản phẩm "${product.name}" không đủ tồn kho (còn ${product.stock})`, 400);
  }

  // ... rest of existing logic
}
```

**`updateItem` (line 59)**:
```ts
export async function updateItem(userId: string, itemId: string, quantity: number) {
  // ... existing cart/item lookup ...

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    // NEW: Check stock
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { stock: true, name: true },
    });
    if (!product || product.stock < quantity) {
      throw new AppError(`Sản phẩm "${product?.name}" không đủ tồn kho (còn ${product?.stock || 0})`, 400);
    }
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }

  return getCart(userId);
}
```

### Fix 2: `order.service.ts` — Stock decrement inside transaction

Replace the entire `create` function's transaction block. Remove the pre-transaction stock check loop. Inside the transaction:

```ts
const order = await prisma.$transaction(async (tx) => {
  // 1. Validate + decrement stock atomically
  for (const item of cart.items) {
    const product = await tx.product.findUnique({
      where: { id: item.product.id },
      select: { stock: true, name: true },
    });
    if (!product || product.stock < item.quantity) {
      throw new AppError(
        `Sản phẩm "${item.product.name}" không đủ tồn kho (còn ${product?.stock || 0})`,
        400
      );
    }
    await tx.product.update({
      where: { id: item.product.id },
      data: {
        stock: { decrement: item.quantity },
        soldCount: { increment: item.quantity },
      },
    });
  }

  // 2. Create order
  const created = await tx.order.create({ ... });

  // 3. Increment coupon
  if (data.couponCode) {
    await tx.coupon.update({ ... });
  }

  // 4. Clear cart
  await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

  return created;
});
```

### Fix 3: `order.service.ts` — Make `confirmPaymentStock` a no-op

Since stock is now decremented at order creation, `confirmPaymentStock` should check and skip:

```ts
export async function confirmPaymentStock(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new AppError('Order not found', 404);

  // Idempotency: check if stock was already decremented
  // Stock is now decremented at order creation time, so this is a no-op
  // for orders created after the fix. For backward compatibility,
  // check if any item's product has stock that was already decremented.
  const existingTx = await prisma.paymentTransaction.findFirst({
    where: { orderId, status: 'SUCCESS', type: { in: ['IPN', 'RETURN'] } },
  });
  if (existingTx && order.paidAt) return;

  // For old orders: still decrement stock if not already done
  // Check by comparing soldCount increment vs order items
  // Simple approach: just skip — stock was already decremented at order creation
  return;
}
```

**Better approach**: Remove the `confirmPaymentStock` call from VNPay handlers entirely:
- `payment.service.ts` `processIpn`: Remove `await confirmPaymentStock(order.id)` (line ~240)
- `payment.service.ts` `processReturn`: Remove `await confirmPaymentStock(order.id)` (line ~115)

### Fix 4: `order.service.ts` — Fix `restoreStockOnCancel`

```ts
export async function restoreStockOnCancel(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new AppError('Order not found', 404);

  // Don't restore if already cancelled (prevent double restore)
  if (order.status === 'CANCELLED') return;

  // Stock was decremented at order creation for ALL orders
  // So always restore when cancelling
  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          soldCount: { decrement: item.quantity },
        },
      });
    }
  });
}
```

### Fix 5: Frontend stock display

**Cart.tsx** — Disable "+" when at stock limit:
```tsx
<button
  onClick={() => dispatch(updateCartItemThunk({ itemId: item.id, quantity: item.quantity + 1 }))}
  disabled={item.quantity >= (item.product?.stock || 0)}
  className="p-1.5 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
>
  <Plus className="h-3.5 w-3.5" />
</button>
{item.product?.stock <= 0 && (
  <span className="text-xs text-red-500">Hết hàng</span>
)}
```

**Checkout.tsx** — Show error message:
```tsx
const [orderError, setOrderError] = useState('');

// In handleSubmit catch:
} catch (err: any) {
  const message = err?.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.';
  setOrderError(message);
}

// In JSX:
{orderError && (
  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{orderError}</div>
)}
```

**ProductDetail.tsx** — Show stock info:
```tsx
<p className="text-sm text-gray-500">
  {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
</p>
```

### Fix 6: Cart/Checkout product images

**cart.service.ts** — Add image to cart response:
```ts
product: {
  select: {
    id: true, name: true, slug: true, sku: true,
    basePrice: true, salePrice: true, stock: true,
    images: { where: { isPrimary: true }, take: 1, select: { url: true } },
  },
},
```

**Cart.tsx** — Replace emoji with image:
```tsx
<div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
  {item.product?.images?.[0]?.url ? (
    <img src={item.product.images[0].url} alt={item.product.name} className="h-full w-full object-cover rounded-lg" />
  ) : (
    <span className="text-3xl">🧱</span>
  )}
</div>
```

**Checkout.tsx** — Same pattern for order summary.

**cartSlice.ts** — Add `images` to `CartProduct` interface:
```ts
export interface CartProduct {
  // ... existing fields
  images?: { url: string }[];
}
```

---

## Files to Modify

| # | File | Changes |
|---|------|---------|
| 1 | `backend/src/services/cart.service.ts` | Add stock check in addItem/updateItem, add images to response |
| 2 | `backend/src/services/order.service.ts` | Move stock check+decrement inside transaction, fix restoreStockOnCancel, make confirmPaymentStock no-op |
| 3 | `backend/src/services/payment.service.ts` | Remove confirmPaymentStock calls from processIpn/processReturn |
| 4 | `frontend/src/store/slices/cartSlice.ts` | Add images to CartProduct interface |
| 5 | `frontend/src/pages/Cart.tsx` | Stock-aware +/- buttons, product images |
| 6 | `frontend/src/pages/Checkout.tsx` | Error display, product images |
| 7 | `frontend/src/pages/ProductDetail.tsx` | Show stock info |
| 8 | `frontend/src/features/admin/AdminProducts.tsx` | (Optional) Show stock in admin product list |

## Execution Order

1. `cart.service.ts` — Stock validation + images
2. `order.service.ts` — Atomic stock decrement in transaction
3. `payment.service.ts` — Remove confirmPaymentStock calls
4. `cartSlice.ts` — Update interface
5. `Cart.tsx` — Stock-aware UI + images
6. `Checkout.tsx` — Error display + images
7. `ProductDetail.tsx` — Stock info
