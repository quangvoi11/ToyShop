import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || '';

if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be a random string of at least 32 characters');
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  trustProxy: parseInt(process.env.TRUST_PROXY || '0', 10),
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'Ele Store <noreply@elestore.com>',
  },
  brevoApiKey: process.env.BREVO_API_KEY || '',
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  vnpay: {
    tmnCode: process.env.VNPAY_TMN_CODE || '',
    hashSecret: process.env.VNPAY_HASH_SECRET || '',
    url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/v1/payment/vnpay/result',
    ipnUrl: process.env.VNPAY_IPN_URL || 'http://localhost:5000/api/v1/payment/vnpay/ipn',
    expireMinutes: parseInt(process.env.VNPAY_EXPIRE_MINUTES || '15', 10),
  },
};
