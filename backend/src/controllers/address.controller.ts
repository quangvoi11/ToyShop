import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as addressService from '../services/address.service';

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const address = await addressService.getById(req.params.id, req.user!.userId);
  res.json({ success: true, data: address });
});

export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await addressService.getAddresses(req.user!.userId);
  res.json({ success: true, data: addresses });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const address = await addressService.create({ userId: req.user!.userId, ...req.body });
  res.status(201).json({ success: true, data: address });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const address = await addressService.update(req.params.id, req.user!.userId, req.body);
  res.json({ success: true, data: address });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await addressService.remove(req.params.id, req.user!.userId);
  res.json({ success: true, message: 'Address deleted' });
});
