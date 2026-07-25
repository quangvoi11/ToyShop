# Inventory & Order Flow — Full Bug Fix Execution Prompt

## Task
Fix all inventory/stock management bugs in the ToyShop (Ele Store) e-commerce platform. Products in stock are NOT being reserved or decremented when orders are placed. This is a CRITICAL fix — overselling is currently possible.

## Project Context
- Monorepo: `@toyshop/backend` (Node.js/Express/Prisma/SQL Server), `@toyshop/frontend` (React 18/Vite/TypeScript/Tailwind/Redux Toolkit)
- Database: SQL Server via Prisma ORM
- Product model has `stock` (Int) and `soldCount` (Int) fields
- ProductVariant model has its own `stock` field
- CartItem has optional `variantId`
- Order creation currently validates stock OUTSIDE the transaction (race condition)
- Stock decrement currently only happens via VNPay payment confirmation (`confirmPaymentStock`)
- COD orders have NO payment confirmation flow → stock NEVER decremented

## Architecture Understanding

### Current Order Flow (BROKEN):
```
1. User adds to cart → NO stock check (Bug 4)
2. User clicks checkout → frontend NO stock check (Bug 8, 9)
3. POST /orders → stock check OUTSIDE transaction (Bug 2)
4. Order created, cart cleared → stock NOT decremented
5. If VNPay: IPN/Return → confirmPaymentStock → stock decremented
6. If COD: NOTHING → stock NEVER decremented (Bug 1)
```

### Fixed Order Flow:
```
1. User adds to cart → stock validated (Fix 1)
2. User clicks checkout → frontend shows stock info (Fix 5)
3. POST /orders → stock check + decrement INSIDE atomic transaction (Fix 2)
4. Order created, stock decremented, cart cleared → DONE
5. VNPay IPN/Return → confirmPaymentStock becomes no-op (Fix 3)
6. Cancel order → stock always restored (Fix 4)
```

---

## Files to Modify (7 files)

---

### File 1: `backend/src/services/cart.service.ts`

**Goal**: Add stock validation on cart add/update. Add product images to cart response.

**Current problems**:
- `addItem()` (line 39): No stock check — user can add any quantity
- `updateItem()` (line 59): No stock check — user can set any quantity
- Cart response doesn't include product images

**Changes**:

#### 1a. Add stock check to `addItem` (after line 42, after product lookup):
```ts
// ADD after: if (!product) throw new AppError('Product not found', 404);
if (product.stock < quantity) {
  throw new AppError(`Sản phẩm "${product.name}" không đủ tồn kho (còn ${product.stock})`, 400);
}
```

#### 1b. Add stock check to `updateItem` (after line 65, before the update):
```ts
// ADD after the quantity <= 0 check, inside the else branch:
// Before: await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
const product = await prisma.product.findUnique({
  where: { id: item.productId },
  select: { stock: true, name: true },
});
if (!product || product.stock < quantity) {
  throw new AppError(
    `Sản phẩm "${product?.name}" không đủ tồn kho (còn ${product?.stock || 0})`,
    400
  );
}
```

#### 1c. Add images to cart product query (both in `getCart` and `addItem`→`getCart`):

In `getCart` function, change the product select to include images:
```ts
// CURRENT:
product: {
  select: { id: true, name: true, slug: true, sku: true, basePrice: true, salePrice: true, stock: true },
},

// NEW:
product: {
  select: {
    id: true, name: true, slug: true, sku: true,
    basePrice: true, salePrice: true, stock: true,
    images: { where: { isPrimary: true }, take: 1, select: { url: true } },
  },
},
```

There are TWO places in `getCart` that need this change (the initial findUnique and the cart.create include).

---

### File 2: `backend/src/services/order.service.ts`

**Goal**: Move stock check+decrement inside atomic transaction. Fix restoreStockOnCancel. Make confirmPaymentStock a no-op.

#### 2a. Remove the pre-transaction stock validation loop (DELETE lines 68-80):
```ts
// DELETE this entire block:
// Validate stock availability before creating order
for (const item of cart.items) {
  const product = await prisma.product.findUnique({
    where: { id: item.product.id },
    select: { stock: true, name: true },
  });
  if (!product || product.stock < item.quantity) {
    throw new AppError(
      `Sản phẩm "${item.product.name}" không đủ tồn kho (còn ${product?.stock || 0})`,
      400
    );
  }
}
```

#### 2b. Add stock check + decrement INSIDE the transaction (ADD at the beginning of the $transaction callback, before order creation):

```ts
const order = await prisma.$transaction(async (tx) => {
  // === NEW: Validate and decrement stock atomically ===
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
  // === END NEW ===

  // ... rest of existing transaction code (order creation, coupon, cart clear) ...
```

#### 2c. Fix `restoreStockOnCancel` (replace the entire function):

```ts
export async function restoreStockOnCancel(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new AppError('Order not found', 404);

  // Don't restore if already cancelled (prevent double restore)
  if (order.status === 'CANCELLED') return;

  // Stock is decremented at order creation for ALL orders
  // So always restore when cancelling (for PENDING, CONFIRMED, etc.)
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

#### 2d. Make `confirmPaymentStock` a safe no-op (replace the entire function):

Since stock is now decremented at order creation, this function should do nothing for new orders. Keep it for backward compatibility with old orders but make it safe:

```ts
export async function confirmPaymentStock(_orderId: string) {
  // Stock is now decremented at order creation time (inside the order transaction).
  // This function is kept for backward compatibility but is now a no-op.
  // VNPay IPN/Return handlers should no longer call this.
  return;
}
```

---

### File 3: `backend/src/services/payment.service.ts`

**Goal**: Remove confirmPaymentStock calls from VNPay handlers (stock already decremented at order creation).

#### 3a. In `processReturn` function, DELETE the confirmPaymentStock call (around lines 112-117):

```ts
// DELETE this block:
  // Decrement stock AFTER successful payment (only if IPN hasn't already done it)
  if (isSuccessful) {
    try {
      await confirmPaymentStock(order.id);
    } catch (e) {
      // Stock may already be decremented by IPN - ignore if so
    }
  }
```

Also remove the import of `confirmPaymentStock` from the top of the file if it's no longer used anywhere.

#### 3b. In `processIpn` function, DELETE the confirmPaymentStock call (around line 240):

```ts
// DELETE this block:
  // Decrement stock AFTER successful payment confirmation
  if (isSuccessful) {
    await confirmPaymentStock(order.id);
  }
```

#### 3c. Remove unused import:
```ts
// DELETE: import { confirmPaymentStock } from './order.service';
```

---

### File 4: `frontend/src/store/slices/cartSlice.ts`

**Goal**: Add images to CartProduct interface.

#### 4a. Update `CartProduct` interface (add `images` field):

```ts
export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  basePrice: number;
  salePrice: number | null;
  stock: number;
  images?: { url: string }[];  // ADD THIS LINE
}
```

---

### File 5: `frontend/src/pages/Cart.tsx`

**Goal**: Stock-aware quantity controls. Product images instead of emoji.

#### 5a. Replace emoji placeholder with product image (around line 67):

```tsx
// CURRENT:
<div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
  <span className="text-3xl">🧱</span>
</div>

// NEW:
<div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
  {item.product?.images?.[0]?.url ? (
    <img
      src={item.product.images[0].url}
      alt={item.product.name}
      className="h-full w-full object-cover"
    />
  ) : (
    <span className="text-3xl">🧱</span>
  )}
</div>
```

#### 5b. Make "+" button stock-aware (around line 97-107):

```tsx
// CURRENT:
<button
  onClick={() =>
    dispatch(updateCartItemThunk({ itemId: item.id, quantity: item.quantity + 1 }))
  }
  className="p-1.5 hover:bg-gray-50"
>
  <Plus className="h-3.5 w-3.5" />
</button>

// NEW:
<button
  onClick={() =>
    dispatch(updateCartItemThunk({ itemId: item.id, quantity: item.quantity + 1 }))
  }
  disabled={item.quantity >= (item.product?.stock ?? Infinity)}
  className="p-1.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
>
  <Plus className="h-3.5 w-3.5" />
</button>
```

#### 5c. Add stock warning below quantity controls (after the +/- buttons div):

```tsx
{item.product?.stock !== undefined && item.product.stock <= 5 && item.product.stock > 0 && (
  <p className="text-xs text-orange-500">Chỉ còn {item.product.stock} sản phẩm</p>
)}
{item.product?.stock === 0 && (
  <p className="text-xs text-red-500 font-medium">Hết hàng</p>
)}
```

---

### File 6: `frontend/src/pages/Checkout.tsx`

**Goal**: Show order errors to user. Product images in order summary.

#### 6a. Add error state (near the other useState declarations, around line 27):

```ts
const [orderError, setOrderError] = useState('');
```

#### 6b. Update handleSubmit error handling (around line 121-128):

```tsx
// CURRENT:
} catch (err) {
  console.error(err);
}

// NEW:
} catch (err: any) {
  const message = err?.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.';
  setOrderError(message);
}
```

#### 6c. Clear error when retrying (at the start of handleSubmit, after setSubmitting):

```tsx
setOrderError('');
setSubmitting(true);
```

#### 6d. Show error in JSX (before the order summary section, or inside the summary card):

```tsx
{orderError && (
  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
    {orderError}
    <button onClick={() => setOrderError('')} className="float-right font-medium hover:underline">×</button>
  </div>
}
```

Place this inside the sticky order summary div, after `<h2>Đơn hàng</h2>`.

#### 6e. Replace emoji placeholder with product image (around line 186):

```tsx
// CURRENT:
<div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-lg">🧱</div>

// NEW:
<div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-gray-100">
  {item.product?.images?.[0]?.url ? (
    <img
      src={item.product.images[0].url}
      alt={item.product.name}
      className="h-full w-full object-cover"
    />
  ) : (
    <span className="text-lg">🧱</span>
  )}
</div>
```

---

### File 7: `frontend/src/pages/ProductDetail.tsx`

**Goal**: Show stock information on product detail page.

#### 7a. Add stock display near the price/quantity section:

Find the section that shows product info (price, quantity selector, add to cart button). Add stock display:

```tsx
{/* ADD after price display, before quantity selector */}
<p className="text-sm text-gray-500">
  {product.stock > 0 ? (
    <>Còn <span className="font-medium text-green-600">{product.stock}</span> sản phẩm</>
  ) : (
    <span className="font-medium text-red-500">Hết hàng</span>
  )}
</p>
```

#### 7b. Disable "Add to cart" button when out of stock:

Find the add-to-cart button and add disabled state:

```tsx
<button
  onClick={handleAddToCart}
  disabled={product.stock <= 0 || quantity > product.stock}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
  {product.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
</button>
```

---

## Execution Order

1. **`cart.service.ts`** — Stock validation + images (foundation)
2. **`order.service.ts`** — Atomic stock in transaction + fix restore + no-op confirmPaymentStock
3. **`payment.service.ts`** — Remove confirmPaymentStock calls
4. **`cartSlice.ts`** — Update interface
5. **`Cart.tsx`** — Stock-aware UI + images
6. **`Checkout.tsx`** — Error display + images
7. **`ProductDetail.tsx`** — Stock info

## Verification

After all changes, verify:

- [ ] `npm run lint` in frontend passes
- [ ] `npx tsc --noEmit` in frontend passes (type check)
- [ ] Cart: Cannot add item exceeding stock → error message shown
- [ ] Cart: Cannot increment quantity beyond stock → button disabled
- [ ] Cart: Product images display correctly
- [ ] Checkout: Order creation error shows red banner
- [ ] Checkout: Product images display in summary
- [ ] Product detail: Stock count shown ("Còn X sản phẩm" or "Hết hàng")
- [ ] Product detail: "Thêm vào giỏ" disabled when stock = 0
- [ ] Order creation (COD): Stock decremented immediately
- [ ] Order creation (VNPay): Stock decremented immediately
- [ ] Order cancellation: Stock restored
- [ ] Concurrent orders: Only one succeeds when stock = 1 (transaction prevents oversell)
- [ ] Old VNPay orders: confirmPaymentStock is no-op, no errors

## Important Notes

- **Run `npm run lint` in `frontend/` after all changes** — project has `--max-warnings 0`
- **Do NOT modify `prisma/schema.prisma`** — no schema changes needed
- **Do NOT create new files** — only modify existing files
- **Keep the `confirmPaymentStock` function** in `order.service.ts` but make it a no-op — don't delete it in case there are other callers
- **Test with both COD and VNPay** payment methods
- **The transaction in `order.service.ts` uses Prisma's `$transaction`** — SQL Server supports this natively
- **Product images come from `ProductImage` model** via the `images` relation on `Product`
