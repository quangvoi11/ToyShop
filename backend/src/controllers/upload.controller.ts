import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as uploadService from '../services/upload.service';

export const uploadSingle = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new Error('No file uploaded');
  const folder = typeof req.query.folder === 'string' ? req.query.folder : undefined;
  const url = await uploadService.saveImage(req.file, folder);
  res.json({ success: true, data: { url } });
});

export const uploadMultiple = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) throw new Error('No files uploaded');
  const folder = typeof req.query.folder === 'string' ? req.query.folder : undefined;
  const urls = await uploadService.saveMultiple(files, folder);
  res.json({ success: true, data: { urls } });
});
