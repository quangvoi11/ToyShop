import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as adminCouponService from '../services/admin-coupon.service';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await adminCouponService.getAll(page, limit);
  res.json({ success: true, ...result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await adminCouponService.getById(req.params.id);
  res.json({ success: true, data: coupon });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await adminCouponService.create(req.body);
  res.status(201).json({ success: true, data: coupon });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await adminCouponService.update(req.params.id, req.body);
  res.json({ success: true, data: coupon });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await adminCouponService.remove(req.params.id);
  res.json({ success: true, message: 'Coupon deleted' });
});
