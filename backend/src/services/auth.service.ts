import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import type { JwtPayload } from '../middleware/auth';
import { sendResetEmail, sendVerificationEmail } from './email.service';

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Unable to register', 400);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: 'CUSTOMER',
      verificationToken: hashToken(verificationToken),
      verificationExpires,
    },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  const verifyUrl = `${config.clientUrl}/verify-email?token=${verificationToken}`;
  try {
    await sendVerificationEmail(user.email, user.firstName, verifyUrl);
  } catch (err) {
    logger.error('Failed to send verification email:', err);
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    throw new AppError('Không thể gửi email xác thực, vui lòng thử lại sau', 502, 'EMAIL_SEND_FAILED');
  }

  return { message: 'Vui lòng kiểm tra email để xác thực tài khoản' };
}

export async function login(email: string, password: string, portal = 'customer') {
  const user = await prisma.user.findUnique({ where: { email } });

  const valid = user ? await bcrypt.compare(password, user.password) : false;
  if (!user || !valid || !user.isActive) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  if (user.emailVerifiedAt === null) {
    throw new AppError('Tài khoản chưa được xác thực email', 403, 'EMAIL_NOT_VERIFIED');
  }

  const allowedRoles = portal === 'admin' ? ['ADMIN', 'STAFF'] : ['CUSTOMER'];
  if (!allowedRoles.includes(user.role)) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: null, resetTokenExpires: null },
  });

  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      verificationToken: hashToken(token),
      verificationExpires: { gt: new Date() },
      emailVerifiedAt: null,
      isActive: true,
    },
  });
  if (!user) throw new AppError('Liên kết xác thực không hợp lệ hoặc đã hết hạn', 400);

  return prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date(), verificationToken: null, verificationExpires: null },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatar: true, role: true, createdAt: true, emailVerifiedAt: true },
  });
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findFirst({ where: { email, emailVerifiedAt: null } });

  if (user) {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: hashToken(verificationToken), verificationExpires },
    });

    const verifyUrl = `${config.clientUrl}/verify-email?token=${verificationToken}`;
    try {
      await sendVerificationEmail(user.email, user.firstName, verifyUrl);
    } catch (err) {
      logger.error('Failed to send verification email:', err);
      throw new AppError('Không thể gửi email xác thực, vui lòng thử lại sau', 502, 'EMAIL_SEND_FAILED');
    }
  }

  return { message: 'Nếu email tồn tại, liên kết xác thực sẽ được gửi' };
}

export async function updateProfile(userId: string, data: {
  firstName?: string;
  lastName?: string;
  phone: string;
  avatar?: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
      ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
      phone: data.phone,
      ...(data.avatar !== undefined ? { avatar: data.avatar === '' ? null : data.avatar } : {}),
    },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatar: true, role: true, createdAt: true },
  });
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatar: true, role: true, createdAt: true },
  });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
}

export async function refreshTokens(refreshToken: string) {
  const token = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: { user: true },
  });

  if (!token || token.expiresAt <= new Date() || !token.user.isActive) {
    if (token) await revokeRefreshToken(refreshToken);
    throw new AppError('Session expired, please log in again', 401);
  }

  const newRefreshToken = await issueRefreshToken(token.userId);
  await revokeRefreshToken(refreshToken);

  const accessToken = generateAccessToken({ userId: token.userId, role: token.user.role });
  return {
    user: {
      id: token.user.id,
      email: token.user.email,
      firstName: token.user.firstName,
      lastName: token.user.lastName,
      phone: token.user.phone,
      avatar: token.user.avatar,
      role: token.user.role,
    },
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logout(userId: string, refreshToken?: string) {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(refreshToken) } });
  } else {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }
  return { message: 'Logged out successfully' };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { message: 'If this email exists, a reset link has been sent' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpires = new Date(Date.now() + 3600000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: hashToken(resetToken), resetTokenExpires },
  });

  const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;
  try {
    await sendResetEmail(email, resetUrl);
  } catch (err) {
    logger.error('Failed to send reset email:', err);
    throw new AppError('Không thể gửi email, vui lòng thử lại sau', 502);
  }

  return { message: 'If this email exists, a reset link has been sent' };
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashToken(token),
      resetTokenExpires: { gt: new Date() },
      isActive: true,
    },
  });
  if (!user) throw new AppError('Invalid or expired reset token', 400);

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpires: null,
    },
  });

  return { message: 'Password reset successfully' };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AppError('Current password is incorrect', 401);

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword, resetToken: null, resetTokenExpires: null },
  });
  await prisma.refreshToken.deleteMany({ where: { userId } });

  return { message: 'Password changed successfully' };
}

function parseDurationMs(value: string): number {
  const match = value.match(/^(\d+)\s*(s|m|h|d)?$/i);
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const n = Number(match[1]);
  const unit = (match[2] || 'm').toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return n * multipliers[unit];
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });
}

async function issueRefreshToken(userId: string): Promise<string> {
  const raw = `${userId}.${crypto.randomBytes(48).toString('base64url')}`;
  const expiresAt = new Date(Date.now() + parseDurationMs(config.jwt.refreshExpiresIn));
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(raw), expiresAt },
  });
  return raw;
}

async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(refreshToken) } });
}
