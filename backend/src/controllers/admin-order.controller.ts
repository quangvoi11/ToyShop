import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as adminOrderService from '../services/admin-order.service';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

  const result = await adminOrderService.getAll({
    page, limit, status, search, sortBy, sortOrder,
  });
  res.json({ success: true, ...result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const order = await adminOrderService.getById(req.params.id);
  res.json({ success: true, data: order });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, cancelReason } = req.body;
  const order = await adminOrderService.updateStatus(req.params.id, status, cancelReason);
  res.json({ success: true, data: order });
});

export const updatePaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { paymentStatus } = req.body;
  const order = await adminOrderService.updatePaymentStatus(req.params.id, paymentStatus);
  res.json({ success: true, data: order });
});
