import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as reviewService from '../services/review.service';

export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query;
  const result = await reviewService.getProductReviews(
    req.params.productId,
    Number(page) || 1,
    Number(limit) || 10,
  );
  res.json({ success: true, ...result });
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.createReview(req.user!.userId, req.params.productId, req.body);
  res.status(201).json({ success: true, data: review });
});
