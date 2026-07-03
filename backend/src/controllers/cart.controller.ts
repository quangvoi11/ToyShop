import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as cartService from '../services/cart.service';

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.getCart(req.user!.userId);
  res.json({ success: true, data: cart });
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity, variantId } = req.body;
  const cart = await cartService.addItem(req.user!.userId, productId, quantity || 1, variantId);
  res.status(201).json({ success: true, data: cart });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.updateItem(req.user!.userId, req.params.itemId, req.body.quantity);
  res.json({ success: true, data: cart });
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.removeItem(req.user!.userId, req.params.itemId);
  res.json({ success: true, data: cart });
});
