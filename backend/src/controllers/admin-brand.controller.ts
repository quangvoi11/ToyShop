import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as service from '../services/admin-brand.service';

export const getList = asyncHandler(async (_req: Request, res: Response) => {
  const brands = await service.getList();
  res.json({ success: true, data: brands });
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getAll(req.query);
  res.json({ success: true, ...result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const brand = await service.getById(req.params.id);
  res.json({ success: true, data: brand });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const brand = await service.create(req.body);
  res.status(201).json({ success: true, data: brand });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const brand = await service.update(req.params.id, req.body);
  res.json({ success: true, data: brand });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.remove(req.params.id);
  res.json({ success: true, message: 'Thương hiệu đã được ẩn' });
});
