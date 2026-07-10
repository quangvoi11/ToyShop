import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = join(__dirname, '../../uploads/images');

export async function saveImage(file: Express.Multer.File): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = extname(file.originalname) || '.jpg';
  const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const filepath = join(UPLOAD_DIR, filename);

  await writeFile(filepath, file.buffer);

  return filename;
}

export async function saveMultiple(files: Express.Multer.File[]): Promise<string[]> {
  return Promise.all(files.map(saveImage));
}
