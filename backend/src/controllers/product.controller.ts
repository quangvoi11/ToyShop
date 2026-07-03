import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as productService from '../services/product.service';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, category, search, sort } = req.query;
  const result = await productService.getAll({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    categorySlug: category as string,
    search: search as string,
    sort: sort as string,
  });
  res.json({ success: true, ...result });
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getBySlug(req.params.slug);
  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found' });
    return;
  }
  res.json({ success: true, data: product });
});

export const getFeatured = asyncHandler(async (_req: Request, res: Response) => {
  const products = await productService.getFeatured();
  res.json({ success: true, data: products });
});
