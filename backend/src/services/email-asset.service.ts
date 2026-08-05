import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const ASSETS = [
  { key: 'logo', file: 'logo-hero.png' },
  { key: 'facebook', file: 'icons/facebook.png' },
  { key: 'instagram', file: 'icons/instagram.png' },
  { key: 'youtube', file: 'icons/youtube.png' },
] as const;

export type EmailAssetKey = (typeof ASSETS)[number]['key'];

const cache: Partial<Record<EmailAssetKey, string>> = {};
let cachePromise: Promise<Partial<Record<EmailAssetKey, string>>> | null = null;

function resolveFile(file: string): string {
  const candidates = [
    path.join(process.cwd(), 'assets', file),
    path.join(__dirname, '..', '..', 'assets', file),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

export function ensureEmailAssets(): Promise<Partial<Record<EmailAssetKey, string>>> {
  if (cachePromise) return cachePromise;
  cachePromise = (async () => {
    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
      return cache;
    }
    for (const asset of ASSETS) {
      const file = resolveFile(asset.file);
      if (!fs.existsSync(file)) continue;
      try {
        const result = await cloudinary.uploader.upload(file, {
          folder: 'toyshop/email',
          public_id: asset.key,
          overwrite: true,
        });
        cache[asset.key] = result.secure_url;
      } catch (err) {
        console.error(`Email asset upload failed (${asset.key}):`, err);
      }
    }
    return cache;
  })();
  return cachePromise;
}

export function getEmailAssetUrl(key: EmailAssetKey): string | undefined {
  return cache[key];
}
