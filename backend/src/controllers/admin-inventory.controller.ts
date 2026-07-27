import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as service from '../services/admin-inventory.service';

export const getStockOverview = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getStockOverview(req.query);
  res.json({ success: true, ...result });
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const movement = await service.adjustStock(req.body, req.user!.userId);
  res.json({ success: true, data: movement });
});

export const getMovements = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getMovements(req.query);
  res.json({ success: true, ...result });
});

export const getMovementById = asyncHandler(async (req: Request, res: Response) => {
  const movement = await service.getMovementById(req.params.id);
  res.json({ success: true, data: movement });
});

export const getAllWarehouses = asyncHandler(async (_req: Request, res: Response) => {
  const warehouses = await service.getAllWarehouses();
  res.json({ success: true, data: warehouses });
});

export const createWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const warehouse = await service.createWarehouse(req.body);
  res.status(201).json({ success: true, data: warehouse });
});

export const updateWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const warehouse = await service.updateWarehouse(req.params.id, req.body);
  res.json({ success: true, data: warehouse });
});

export const deactivateWarehouse = asyncHandler(async (req: Request, res: Response) => {
  await service.deactivateWarehouse(req.params.id);
  res.json({ success: true, message: 'Kho đã được ẩn' });
});

export const getAllBatches = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getAllBatches(req.query);
  res.json({ success: true, ...result });
});

export const createBatch = asyncHandler(async (req: Request, res: Response) => {
  const batch = await service.createBatch(req.body, req.user!.userId);
  res.status(201).json({ success: true, data: batch });
});

export const updateBatch = asyncHandler(async (req: Request, res: Response) => {
  const batch = await service.updateBatch(req.params.id, req.body);
  res.json({ success: true, data: batch });
});
