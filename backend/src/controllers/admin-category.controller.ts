import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as adminCategoryService from '../services/admin-category.service';
import { slugify } from '@shared/utils/index';

export const getTree = asyncHandler(async (_req: Request, res: Response) => {
  const tree = await adminCategoryService.getTree();
  res.json({ success: true, data: tree });
});

export const getFlat = asyncHandler(async (_req: Request, res: Response) => {
  const flat = await adminCategoryService.getFlat();
  res.json({ success: true, data: flat });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const category = await adminCategoryService.getById(req.params.id);
  res.json({ success: true, data: category });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = {
    ...req.body,
    slug: req.body.slug || slugify(req.body.name),
  };
  const category = await adminCategoryService.create(data);
  res.status(201).json({ success: true, data: category });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  if (data.name && !data.slug) {
    data.slug = slugify(data.name);
  }
  const category = await adminCategoryService.update(req.params.id, data);
  res.json({ success: true, data: category });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await adminCategoryService.remove(req.params.id);
  res.json({ success: true, message: 'Category deactivated' });
});
