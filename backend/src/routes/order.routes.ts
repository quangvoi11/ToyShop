import { Router } from 'express';
import { create, getMyOrders, getById, cancelOrder } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.post('/orders', create);
router.get('/orders', getMyOrders);
router.get('/orders/:id', getById);
router.patch('/orders/:id/cancel', cancelOrder);

export default router;
