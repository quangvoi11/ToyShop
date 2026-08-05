import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/admin-order.controller';
import { updateOrderStatusSchema, updatePaymentStatusSchema } from '../validators/order.validator';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'STAFF'));

router.get('/orders', ctrl.getAll);
router.get('/orders/:id', ctrl.getById);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), ctrl.updateStatus);
router.patch('/orders/:id/payment', validate(updatePaymentStatusSchema), ctrl.updatePaymentStatus);
router.get('/orders/:id/invoice', ctrl.getInvoice);

export default router;
