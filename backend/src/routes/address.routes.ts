import { Router } from 'express';
import { getAddresses, create } from '../controllers/address.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/addresses', getAddresses);
router.post('/addresses', create);

export default router;
