import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/admin-coupon.controller';
import { createCouponSchema, updateCouponSchema } from '../validators/coupon.validator';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/admin/coupons', ctrl.getAll);
router.get('/admin/coupons/:id', ctrl.getById);
router.post('/admin/coupons', validate(createCouponSchema), ctrl.create);
router.put('/admin/coupons/:id', validate(updateCouponSchema), ctrl.update);
router.delete('/admin/coupons/:id', ctrl.remove);

export default router;
