import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as uploadService from '../services/upload.service';

function buildUrl(req: Request, filename: string): string {
  return `${req.protocol}://${req.get('host')}/uploads/images/${filename}`;
}

export const uploadSingle = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new Error('No file uploaded');
  const filename = await uploadService.saveImage(req.file);
  const url = buildUrl(req, filename);
  res.json({ success: true, data: { url } });
});

export const uploadMultiple = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) throw new Error('No files uploaded');
  const filenames = await uploadService.saveMultiple(files);
  const urls = filenames.map((f) => buildUrl(req, f));
  res.json({ success: true, data: { urls } });
});
