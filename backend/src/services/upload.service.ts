import { v2 as cloudinary } from 'cloudinary';
import { config } from '@/config';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export async function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string = 'toyshop/products',
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary upload failed'));
        resolve(result.secure_url);
      },
    );
    uploadStream.end(file.buffer);
  });
}

export async function saveImage(file: Express.Multer.File, folder?: string): Promise<string> {
  return uploadToCloudinary(file, folder);
}

export async function saveMultiple(files: Express.Multer.File[], folder?: string): Promise<string[]> {
  return Promise.all(files.map((f) => uploadToCloudinary(f, folder)));
}

export function publicIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/');
    const idx = parts.indexOf('upload');
    if (idx === -1) return null;
    let rest = parts.slice(idx + 1);
    if (rest[0]?.startsWith('v')) rest = rest.slice(1);
    const joined = rest.join('/');
    return joined.replace(/\.[^/.]+$/, '') || null;
  } catch {
    return null;
  }
}

export async function deleteFromCloudinary(publicId: string | null): Promise<void> {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // best-effort: ignore failures (already removed, invalid id, etc.)
  }
}

export async function deleteImagesFromCloudinary(
  urls: Array<string | null | undefined>,
): Promise<void> {
  await Promise.all(urls.map((url) => deleteFromCloudinary(publicIdFromUrl(url))));
}
