import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getPaymentUrl, handleReturn } from '../controllers/payment.controller';

const router = Router();

router.get('/payment/vnpay/url/:orderId', authenticate, getPaymentUrl);
router.get('/payment/vnpay/result', handleReturn);

export default router;
