import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as couponService from '../services/coupon.service';

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const result = await couponService.validateCoupon(req.body.code);
  res.json({ success: true, data: result });
});
