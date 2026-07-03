import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as wishlistService from '../services/wishlist.service';

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const items = await wishlistService.getWishlist(req.user!.userId);
  res.json({ success: true, data: items });
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const items = await wishlistService.addItem(req.user!.userId, req.body.productId);
  res.status(201).json({ success: true, data: items });
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const items = await wishlistService.removeItem(req.user!.userId, req.params.productId);
  res.json({ success: true, data: items });
});
