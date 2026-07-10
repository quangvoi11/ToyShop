import { Router } from 'express';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/coupon.controller';
import { validateCouponSchema } from '../validators/coupon.validator';

const router = Router();

router.post('/coupons/validate', validate(validateCouponSchema), ctrl.validateCoupon);

export default router;
