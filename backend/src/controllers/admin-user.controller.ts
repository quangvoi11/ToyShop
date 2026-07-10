import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as adminUserService from '../services/admin-user.service';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const search = req.query.search as string | undefined;
  const role = req.query.role as string | undefined;

  const result = await adminUserService.getAll({ page, limit, search, role });
  res.json({ success: true, ...result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminUserService.getById(req.params.id);
  res.json({ success: true, data: user });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body;
  const user = await adminUserService.updateStatus(req.params.id, isActive);
  res.json({ success: true, data: user });
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body;
  const user = await adminUserService.updateRole(req.params.id, role);
  res.json({ success: true, data: user });
});
