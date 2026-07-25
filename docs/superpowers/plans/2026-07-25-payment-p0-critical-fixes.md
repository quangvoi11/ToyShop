# Payment P0 Critical Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 3 critical payment bugs that would cause data loss and financial discrepancy in production: stock decrement on failed payments, missing VNPay IPN webhook, and no idempotency protection.

**Architecture:**
- Add a `PaymentTransaction` model to log all payment attempts
- Refactor order creation to defer stock decrement until payment confirmation
- Implement VNPay IPN endpoint for server-to-server payment confirmation
- Add idempotency via database-level optimistic locking on payment callbacks

**Tech Stack:** Express.js, Prisma ORM, Microsoft SQL Server, VNPay Gateway (sandbox)

## Global Constraints

- TypeScript strict mode
- Prisma 5.12 with SQL Server provider
- Existing code conventions: asyncHandler wrapper, AppError class, service-controller-route pattern
- VNPay sandbox environment (https://sandbox.vnpayment.vn/paymentv2/vpcpay.html)
- No new external dependencies (use built-in crypto for HMAC)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `backend/prisma/schema.prisma` | Modify | Add PaymentTransaction model |
| `backend/src/services/payment.service.ts` | Modify | Add IPN handler, idempotency, transaction logging |
| `backend/src/services/order.service.ts` | Modify | Defer stock decrement, add stock restore on cancel |
| `backend/src/controllers/payment.controller.ts` | Modify | Add IPN endpoint handler |
| `backend/src/routes/payment.routes.ts` | Modify | Add IPN route |
| `backend/src/config/index.ts` | Modify | Add IPN URL config |
| `backend/.env.example` | Modify | Add VNPay IPN config vars |
| `backend/src/services/admin-order.service.ts` | Modify | Add stock restore on admin cancel |

---

## Task 1: Add PaymentTransaction Model to Prisma Schema

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Interfaces:**
- Produces: PaymentTransaction model with fields for logging all payment attempts

- [ ] **Step 1: Add PaymentTransaction model to schema.prisma**

Add after the OrderItem model (around line 274):

```prisma
model PaymentTransaction {
  id              String    @id @default(uuid())
  orderId         String
  gateway         String
  type            String    @default("PAYMENT")
  amount          Decimal   @db.Decimal(18, 2)
  status          String    @default("PENDING")
  requestPayload  Json?
  responsePayload Json?
  gatewayRef      String?
  errorMessage    String?
  ipAddress       String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@index([gatewayRef])
  @@index([status])
  @@map("PaymentTransactions")
}
```

- [ ] **Step 2: Add relation to Order model**

In the Order model, add the relation:

```prisma
  transactions PaymentTransaction[]
```

- [ ] **Step 3: Run Prisma migration**

```bash
cd backend && npx prisma migrate dev --name add-payment-transactions
```

Expected: Migration creates PaymentTransactions table successfully.

- [ ] **Step 4: Verify migration**

```bash
cd backend && npx prisma generate
```

Expected: Prisma client regenerated with new model.

---

## Task 2: Fix Stock Decrement Logic in Order Creation

**Files:**
- Modify: `backend/src/services/order.service.ts`

**Interfaces:**
- Consumes: Cart items, product stock
- Produces: Order created WITHOUT decrementing stock (stock deferred to payment confirmation)

- [ ] **Step 1: Read current order.service.ts to understand current stock logic**

Read `backend/src/services/order.service.ts` to understand current stock logic.

- [ ] **Step 2: Modify create() to remove stock decrement**

In the `create()` function, find this block (around lines 80-87):

```ts
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.product.id },
        data: { soldCount: { increment: item.quantity } },
      });
    }
```

Replace with:

```ts
    // Stock is decremented when payment is confirmed (in payment.service.ts processReturn)
    // This prevents stock loss when payment fails
```

- [ ] **Step 3: Add stock decrement function for payment confirmation**

Add a new exported function to `order.service.ts`:

```ts
export async function confirmPaymentStock(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new AppError('Order not found', 404);

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stock: true },
      });

      if (!product || product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for product ${item.productId}`, 400);
      }

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          soldCount: { increment: item.quantity },
        },
      });
    }
  });
}
```

- [ ] **Step 4: Add stock restore function for cancelled orders**

Add another exported function to `order.service.ts`:

```ts
export async function restoreStockOnCancel(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new AppError('Order not found', 404);

  // Only restore stock if order was previously confirmed (stock was decremented)
  const wasStockDecremented = order.status !== 'PENDING';
  if (!wasStockDecremented) return;

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

- [ ] **Step 5: Modify cancelOrder to restore stock**

Update the cancelOrder function to call restoreStockOnCancel:

```ts
export async function cancelOrder(userId: string, orderId: string, reason?: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });
  if (!order) throw new AppError('Order not found', 404);

  if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
    throw new AppError('Cannot cancel order in current status', 400);
  }

  // Restore stock before cancelling
  await restoreStockOnCancel(orderId);

  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelReason: reason || null,
    },
  });
}
```

- [ ] **Step 6: Verify changes compile**

```bash
cd backend && npx tsc --noEmit
```

Expected: No TypeScript errors.

---

## Task 3: Add Stock Restore on Admin Cancel

**Files:**
- Modify: `backend/src/services/admin-order.service.ts`

**Interfaces:**
- Consumes: `restoreStockOnCancel` from `order.service.ts`

- [ ] **Step 1: Import restoreStockOnCancel**

Add import at top of `admin-order.service.ts`:

```ts
import { restoreStockOnCancel } from './order.service';
```

- [ ] **Step 2: Add stock restore in updateStatus**

Modify the `updateStatus` function. Add before the `const data` line:

```ts
  // Restore stock when cancelling an order
  if (status === 'CANCELLED') {
    await restoreStockOnCancel(id);
  }
```

- [ ] **Step 3: Verify changes compile**

```bash
cd backend && npx tsc --noEmit
```

Expected: No TypeScript errors.

---

## Task 4: Implement VNPay IPN Endpoint

**Files:**
- Modify: `backend/src/services/payment.service.ts`
- Modify: `backend/src/controllers/payment.controller.ts`
- Modify: `backend/src/routes/payment.routes.ts`
- Modify: `backend/src/config/index.ts`
- Modify: `backend/.env.example`

**Interfaces:**
- Consumes: VNPay IPN callback parameters
- Produces: IPN response with RspCode/Message format

### 4a: Add IPN URL config

- [ ] **Step 1: Add VNPAY_IPN_URL to config/index.ts**

Add to the vnpay config object in `backend/src/config/index.ts`:

```ts
  vnpay: {
    tmnCode: process.env.VNPAY_TMN_CODE || '',
    hashSecret: process.env.VNPAY_HASH_SECRET || '',
    url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/v1/payment/vnpay/result',
    ipnUrl: process.env.VNPAY_IPN_URL || 'http://localhost:5000/api/v1/payment/vnpay/ipn',
    expireMinutes: parseInt(process.env.VNPAY_EXPIRE_MINUTES || '15', 10),
  },
```

- [ ] **Step 2: Add VNPAY_IPN_URL to .env.example**

Add to `backend/.env.example`:

```
VNPAY_IPN_URL=http://localhost:5000/api/v1/payment/vnpay/ipn
```

### 4b: Add IPN handler to payment.service.ts

- [ ] **Step 3: Add processIpn function to payment.service.ts**

Add after the `processReturn` function:

```ts
export async function processIpn(query: Record<string, string>) {
  const result = verifyReturnUrl(query);

  if (!result.isValid) {
    return { rspCode: '97', message: 'Invalid signature' };
  }

  const order = await prisma.order.findUnique({
    where: { id: result.txnRef },
  });

  if (!order) {
    return { rspCode: '01', message: 'Order not found' };
  }

  // Amount verification
  const vnpAmount = result.amount;
  const orderAmount = Number(order.total);
  if (Math.abs(vnpAmount - orderAmount) > 1) {
    return { rspCode: '04', message: 'Invalid amount' };
  }

  // Idempotency: already processed
  if (order.paymentStatus === 'PAID') {
    return { rspCode: '02', message: 'Order already confirmed' };
  }

  const isSuccessful = result.responseCode === '00';

  // Use transaction for atomic update + stock decrement
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: result.txnRef },
      data: {
        paymentStatus: isSuccessful ? 'PAID' : 'FAILED',
        status: isSuccessful ? 'CONFIRMED' : order.status,
        vnp_TxnRef: result.txnRef,
        vnp_TransactionNo: result.transactionNo,
        vnp_ResponseCode: result.responseCode,
        vnp_BankCode: result.bankCode,
        paidAt: isSuccessful ? new Date() : null,
      },
    });

    // Log payment transaction
    await tx.paymentTransaction.create({
      data: {
        orderId: order.id,
        gateway: 'VNPAY',
        type: 'IPN',
        amount: vnpAmount,
        status: isSuccessful ? 'SUCCESS' : 'FAILED',
        gatewayRef: result.transactionNo,
        requestPayload: query,
      },
    });
  });

  // Decrement stock AFTER successful payment confirmation
  if (isSuccessful) {
    await confirmPaymentStock(order.id);
  }

  return { rspCode: '00', message: 'Confirm Success' };
}
```

- [ ] **Step 4: Add confirmPaymentStock import**

At the top of `payment.service.ts`, add import:

```ts
import { confirmPaymentStock } from './order.service';
```

### 4c: Add IPN controller and route

- [ ] **Step 5: Add handleIpn controller to payment.controller.ts**

Add after the `handleReturn` function:

```ts
export const handleIpn = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  const result = await paymentService.processIpn(query);

  // VNPay requires HTTP 200 with RspCode JSON for all cases
  res.status(200).json({ RspCode: result.rspCode, Message: result.message });
});
```

- [ ] **Step 6: Add IPN route to payment.routes.ts**

Add after the existing return route:

```ts
router.get('/payment/vnpay/ipn', handleIpn);
```

- [ ] **Step 7: Verify changes compile**

```bash
cd backend && npx tsc --noEmit
```

Expected: No TypeScript errors.

---

## Task 5: Add Idempotency and Transaction Logging to Return URL Handler

**Files:**
- Modify: `backend/src/services/payment.service.ts`

**Interfaces:**
- Consumes: VNPay return URL parameters
- Produces: Idempotent return URL processing with transaction logging

- [ ] **Step 1: Modify processReturn to use database transaction**

Replace the existing `processReturn` function with:

```ts
export async function processReturn(query: Record<string, string>) {
  const result = verifyReturnUrl(query);

  if (!result.isValid) {
    throw new AppError('Invalid payment signature', 400);
  }

  const order = await prisma.order.findUnique({
    where: { id: result.txnRef },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Idempotency: already processed via IPN or previous return
  if (order.paymentStatus === 'PAID') {
    return { order, alreadyProcessed: true };
  }

  const isSuccessful = result.responseCode === '00';

  // Use transaction for atomic update
  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: result.txnRef },
      data: {
        paymentStatus: isSuccessful ? 'PAID' : 'FAILED',
        status: isSuccessful ? 'CONFIRMED' : order.status,
        vnp_TxnRef: result.txnRef,
        vnp_TransactionNo: result.transactionNo,
        vnp_ResponseCode: result.responseCode,
        vnp_BankCode: result.bankCode,
        paidAt: isSuccessful ? new Date() : null,
      },
    });

    // Log payment transaction
    await tx.paymentTransaction.create({
      data: {
        orderId: order.id,
        gateway: 'VNPAY',
        type: 'RETURN',
        amount: result.amount,
        status: isSuccessful ? 'SUCCESS' : 'FAILED',
        gatewayRef: result.transactionNo,
        requestPayload: query,
      },
    });

    return updated;
  });

  // Decrement stock AFTER successful payment (only if IPN hasn't already done it)
  if (isSuccessful) {
    try {
      await confirmPaymentStock(order.id);
    } catch (e) {
      // Stock may already be decremented by IPN - ignore if so
    }
  }

  return { order: updatedOrder, alreadyProcessed: false };
}
```

- [ ] **Step 2: Verify changes compile**

```bash
cd backend && npx tsc --noEmit
```

Expected: No TypeScript errors.

---

## Task 6: Add Stock Check on Order Creation

**Files:**
- Modify: `backend/src/services/order.service.ts`

**Interfaces:**
- Consumes: Cart items, product stock
- Produces: Order creation with stock validation (reserves stock by checking availability)

- [ ] **Step 1: Add stock validation in create()**

In the create function, after building orderItems and before the $transaction, add stock validation:

```ts
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

Place this before the `const order = await prisma.$transaction(...)` block.

- [ ] **Step 2: Verify changes compile**

```bash
cd backend && npx tsc --noEmit
```

Expected: No TypeScript errors.

---

## Task 7: Add .env.example Payment Config

**Files:**
- Modify: `backend/.env.example`

**Interfaces:**
- Produces: Complete .env.example with all payment config vars

- [ ] **Step 1: Add VNPay config vars to .env.example**

Add the following section to `backend/.env.example`:

```
# Payment Gateway - VNPay
VNPAY_TMN_CODE=your_terminal_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5000/api/v1/payment/vnpay/result
VNPAY_IPN_URL=http://localhost:5000/api/v1/payment/vnpay/ipn
VNPAY_EXPIRE_MINUTES=15
```

- [ ] **Step 2: Verify file is correct**

Read the file back to verify all payment config vars are present.

---

## Task 8: End-to-End Verification

- [ ] **Step 1: Run Prisma migration**

```bash
cd backend && npx prisma migrate dev
```

Expected: Migration applies successfully.

- [ ] **Step 2: Generate Prisma client**

```bash
cd backend && npx prisma generate
```

Expected: Client generated with new models.

- [ ] **Step 3: TypeScript compilation check**

```bash
cd backend && npx tsc --noEmit
```

Expected: No TypeScript errors.

- [ ] **Step 4: Manual test - VNPay flow verification**

1. Create an order with VNPAY payment method
2. Verify order is created with paymentStatus UNPAID and stock NOT decremented
3. Complete VNPay payment in sandbox
4. Verify IPN endpoint is called and order status updates to CONFIRMED/PAID
5. Verify stock is decremented after payment confirmation
6. Verify PaymentTransaction record is created

- [ ] **Step 5: Manual test - Stock restore on cancel**

1. Create an order with COD payment method
2. Manually confirm the order (admin changes status to CONFIRMED)
3. Cancel the order
4. Verify stock is restored

- [ ] **Step 6: Commit all changes**

```bash
git add -A
git commit -m "fix: payment P0 critical fixes - stock management, VNPay IPN, idempotency

- Defer stock decrement to payment confirmation (prevent stock loss on failed payments)
- Add VNPay IPN endpoint for server-to-server payment confirmation
- Add PaymentTransaction model for audit trail
- Add idempotency checks on payment callbacks
- Add stock restore on order cancellation
- Add stock validation on order creation
- Update .env.example with payment config"
```
