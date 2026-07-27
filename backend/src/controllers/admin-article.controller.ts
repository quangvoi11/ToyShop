import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as service from '../services/admin-article.service';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getAll(req.query);
  res.json({ success: true, ...result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const article = await service.getById(req.params.id);
  res.json({ success: true, data: article });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const article = await service.create(req.body, req.user!.userId);
  res.status(201).json({ success: true, data: article });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const article = await service.update(req.params.id, req.body);
  res.json({ success: true, data: article });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.remove(req.params.id);
  res.json({ success: true, message: 'Bài viết đã được xóa' });
});

export const togglePublish = asyncHandler(async (req: Request, res: Response) => {
  const article = await service.togglePublish(req.params.id);
  res.json({ success: true, data: article });
});
