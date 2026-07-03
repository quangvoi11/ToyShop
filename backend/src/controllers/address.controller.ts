import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as addressService from '../services/address.service';

export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await addressService.getAddresses(req.user!.userId);
  res.json({ success: true, data: addresses });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const address = await addressService.create({ userId: req.user!.userId, ...req.body });
  res.status(201).json({ success: true, data: address });
});
