import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as ctrl from '../controllers/admin-review.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'STAFF'));

router.get('/reviews', ctrl.getAll);
router.get('/reviews/:id', ctrl.getById);
router.patch('/reviews/:id/toggle', ctrl.toggleActive);
router.delete('/reviews/:id', ctrl.remove);

export default router;
