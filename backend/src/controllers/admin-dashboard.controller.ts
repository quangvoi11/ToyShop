import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as adminDashboardService from '../services/admin-dashboard.service';

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminDashboardService.getStats();
  res.json({ success: true, data: stats });
});
