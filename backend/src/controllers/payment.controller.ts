import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as paymentService from '../services/payment.service';

export const getPaymentUrl = asyncHandler(async (req: Request, res: Response) => {
  const ipAddr = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';
  const result = await paymentService.getPaymentUrlForOrder(
    req.params.orderId,
    req.user!.userId,
    ipAddr,
  );
  res.json({ success: true, data: result });
});

export const handleReturn = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  try {
    const result = await paymentService.processReturn(query);
    const orderId = result.order.id;

    if (result.alreadyProcessed || result.order.paymentStatus === 'PAID') {
      res.redirect(`${clientUrl}/payment/result?status=success&orderId=${orderId}`);
    } else {
      const responseCode = result.order.vnp_ResponseCode;
      const isCancelled = responseCode === '24' || responseCode === '27';
      const status = isCancelled ? 'cancelled' : 'failed';
      res.redirect(`${clientUrl}/payment/result?status=${status}&orderId=${orderId}`);
    }
  } catch (err: any) {
    console.error('[VNPay Return Error]', err?.message || err);
    res.redirect(`${clientUrl}/payment/result?status=failed`);
  }
});

export const handleIpn = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  const result = await paymentService.processIpn(query);

  // VNPay requires HTTP 200 with RspCode JSON for ALL cases
  res.status(200).json({ RspCode: result.rspCode, Message: result.message });
});
