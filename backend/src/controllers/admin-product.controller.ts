import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as adminProductService from '../services/admin-product.service';
import { slugify } from '@shared/utils/index';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await adminProductService.getAll(page, limit);
  res.json({ success: true, ...result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const product = await adminProductService.getById(req.params.id);
  res.json({ success: true, data: product });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = {
    ...req.body,
    slug: req.body.slug || slugify(req.body.name),
  };
  const product = await adminProductService.create(data);
  res.status(201).json({ success: true, data: product });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  if (data.name && !data.slug) {
    data.slug = slugify(data.name);
  }
  const product = await adminProductService.update(req.params.id, data);
  res.json({ success: true, data: product });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await adminProductService.remove(req.params.id);
  res.json({ success: true, message: 'Product deactivated' });
});

export const getBrands = asyncHandler(async (_req: Request, res: Response) => {
  const brands = await adminProductService.getBrands();
  res.json({ success: true, data: brands });
});
