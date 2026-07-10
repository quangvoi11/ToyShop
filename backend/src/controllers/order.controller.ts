import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as orderService from '../services/order.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.create({
    userId: req.user!.userId,
    ...req.body,
  });
  res.status(201).json({ success: true, data: order });
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await orderService.getByUser(req.user!.userId, page, limit);
  res.json({ success: true, ...result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getById(req.user!.userId, req.params.id);
  res.json({ success: true, data: order });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.cancelOrder(req.user!.userId, req.params.id, req.body.reason);
  res.json({ success: true, data: order });
});
