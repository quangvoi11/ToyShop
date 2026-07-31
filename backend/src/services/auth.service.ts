import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import type { JwtPayload } from '../middleware/auth';
import { sendResetEmail } from './email.service';

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
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: 'CUSTOMER',
    },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true },
  });

  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);

  return { user, accessToken, refreshToken };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: null, resetTokenExpires: null },
  });

  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);

  return {
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    accessToken,
    refreshToken,
  };
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
  const userId = refreshToken.split('.')[0];
  if (!userId) throw new AppError('Invalid or expired refresh token', 401);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) throw new AppError('Invalid or expired refresh token', 401);

  const hash = hashToken(refreshToken);
  if (user.refreshToken !== hash) {
    if (user.refreshToken) {
      await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
    }
    throw new AppError('Session expired, please log in again', 401);
  }

  const newRefreshToken = await issueRefreshToken(user.id);
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  return {
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logout(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
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
  await sendResetEmail(email, resetUrl);

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
    data: { password: hashedPassword, resetToken: null, resetTokenExpires: null, refreshToken: null },
  });

  return { message: 'Password changed successfully' };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });
}

async function issueRefreshToken(userId: string): Promise<string> {
  const raw = `${userId}.${crypto.randomBytes(48).toString('base64url')}`;
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: hashToken(raw) } });
  return raw;
}
