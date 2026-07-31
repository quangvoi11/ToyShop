import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, me, refresh, logout, forgotPassword, resetPassword, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from '../validators/auth.validator';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later' },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many reset requests, please try again later' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many registrations, please try again later' },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many reset attempts, please try again later' },
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

router.post('/auth/register', registerLimiter, validate(registerSchema), register);
router.post('/auth/login', loginLimiter, validate(loginSchema), login);
router.get('/auth/me', authenticate, me);
router.post('/auth/refresh', refreshLimiter, refresh);
router.post('/auth/logout', authenticate, logout);
router.post('/auth/change-password', authenticate, changePasswordLimiter, validate(changePasswordSchema), changePassword);
router.post('/auth/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/auth/reset-password', resetPasswordLimiter, validate(resetPasswordSchema), resetPassword);

export default router;
