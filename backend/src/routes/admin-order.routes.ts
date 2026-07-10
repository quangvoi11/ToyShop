import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/admin-order.controller';
import { updateOrderStatusSchema, updatePaymentStatusSchema } from '../validators/order.validator';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/admin/orders', ctrl.getAll);
router.get('/admin/orders/:id', ctrl.getById);
router.patch('/admin/orders/:id/status', validate(updateOrderStatusSchema), ctrl.updateStatus);
router.patch('/admin/orders/:id/payment', validate(updatePaymentStatusSchema), ctrl.updatePaymentStatus);

export default router;
