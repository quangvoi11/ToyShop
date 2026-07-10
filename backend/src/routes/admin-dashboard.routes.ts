import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as ctrl from '../controllers/admin-dashboard.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/admin/dashboard/stats', ctrl.getStats);

export default router;
