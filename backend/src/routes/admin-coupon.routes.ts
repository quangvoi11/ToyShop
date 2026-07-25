import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/admin-coupon.controller';
import { createCouponSchema, updateCouponSchema } from '../validators/coupon.validator';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/coupons', ctrl.getAll);
router.get('/coupons/:id', ctrl.getById);
router.post('/coupons', validate(createCouponSchema), ctrl.create);
router.put('/coupons/:id', validate(updateCouponSchema), ctrl.update);
router.delete('/coupons/:id', ctrl.remove);

export default router;
