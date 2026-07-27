import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as service from '../services/admin-review.service';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getAll(req.query);
  res.json({ success: true, ...result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const review = await service.getById(req.params.id);
  res.json({ success: true, data: review });
});

export const toggleActive = asyncHandler(async (req: Request, res: Response) => {
  const review = await service.toggleActive(req.params.id);
  res.json({ success: true, data: review });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.remove(req.params.id);
  res.json({ success: true, message: 'Đánh giá đã được xóa' });
});
