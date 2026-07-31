import crypto from 'crypto';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
function sortObject(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

export function createPaymentUrl(params: {
  orderId: string;
  orderCode: string;
  amount: number;
  ipAddr: string;
}): string {
  const { orderId, orderCode, amount, ipAddr } = params;
  const { tmnCode, hashSecret, url, returnUrl, expireMinutes } = config.vnpay;

  const date = new Date();
  const createDate = formatDate(date);
  const expireDate = formatDate(new Date(date.getTime() + expireMinutes * 60 * 1000));

  const vnpParams: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Thanh toan don hang ${orderCode}`,
    vnp_OrderType: 'other',
    vnp_Amount: String(amount * 100),
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  const sorted = sortObject(vnpParams);
  const signData = new URLSearchParams(sorted).toString();
  const hmac = crypto.createHmac('sha512', hashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  sorted['vnp_SecureHash'] = signed;

  return `${url}?${new URLSearchParams(sorted).toString()}`;
}

export function verifyReturnUrl(query: Record<string, string>): {
  isValid: boolean;
  responseCode: string;
  txnRef: string;
  transactionNo: string;
  bankCode: string;
  amount: number;
  secureHash: string;
} {
  const secureHash = query['vnp_SecureHash'];
  const params = { ...query };
  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];

  const sorted = sortObject(params);
  const signData = new URLSearchParams(sorted).toString();
  const hmac = crypto.createHmac('sha512', config.vnpay.hashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return {
    isValid: secureHash === signed,
    responseCode: query['vnp_ResponseCode'] || '',
    txnRef: query['vnp_TxnRef'] || '',
    transactionNo: query['vnp_TransactionNo'] || '',
    bankCode: query['vnp_BankCode'] || '',
    amount: parseInt(query['vnp_Amount'] || '0', 10) / 100,
    secureHash,
  };
}

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

  if (Math.abs(result.amount - Number(order.total)) > 1) {
    throw new AppError('Payment amount mismatch', 400);
  }

  // Idempotency: already processed via IPN or previous return
  if (order.paymentStatus === 'PAID') {
    return { order, alreadyProcessed: true };
  }

  const isSuccessful = result.responseCode === '00';

  // Use transaction for atomic update + log
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
        requestPayload: JSON.stringify(query),
      },
    });

    return updated;
  });

  return { order: updatedOrder, alreadyProcessed: false };
}

export async function getPaymentUrlForOrder(orderId: string, userId: string, ipAddr: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) throw new AppError('Order not found', 404);

  if (order.paymentStatus === 'PAID') {
    throw new AppError('Order is already paid', 400);
  }

  if (order.paymentMethod !== 'VNPAY') {
    throw new AppError('Order does not use VNPay', 400);
  }

  const paymentUrl = createPaymentUrl({
    orderId: order.id,
    orderCode: order.orderCode,
    amount: Number(order.total),
    ipAddr,
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { paymentUrl },
  });

  return { paymentUrl };
}

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

  // Use transaction for atomic update + log
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
        requestPayload: JSON.stringify(query),
      },
    });
  });

  return { rspCode: '00', message: 'Confirm Success' };
}

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
