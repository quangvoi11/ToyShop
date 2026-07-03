import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as categoryService from '../services/category.service';

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryService.getAll();
  res.json({ success: true, data: categories });
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getBySlug(req.params.slug);
  if (!category) {
    res.status(404).json({ success: false, message: 'Category not found' });
    return;
  }
  res.json({ success: true, data: category });
});
