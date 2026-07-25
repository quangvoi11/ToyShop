import { Router } from 'express';
import { create, getMyOrders, getById, cancelOrder } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/orders', authenticate, create);
router.get('/orders', authenticate, getMyOrders);
router.get('/orders/:id', authenticate, getById);
router.patch('/orders/:id/cancel', authenticate, cancelOrder);

export default router;
