import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getPaymentUrl, handleReturn, handleIpn } from '../controllers/payment.controller';

const router = Router();

router.get('/payment/vnpay/url/:orderId', authenticate, getPaymentUrl);
router.get('/payment/vnpay/result', handleReturn);
router.get('/payment/vnpay/ipn', handleIpn);

export default router;
