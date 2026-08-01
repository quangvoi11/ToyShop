import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/admin-brand.controller';
import { createBrandSchema, updateBrandSchema } from '../validators/brand.validator';

const router = Router();

router.use(authenticate);

router.get('/brands/list', authorize('ADMIN', 'STAFF'), ctrl.getList);
router.get('/brands', authorize('ADMIN', 'STAFF'), ctrl.getAll);
router.get('/brands/:id', authorize('ADMIN', 'STAFF'), ctrl.getById);
router.post('/brands', authorize('ADMIN'), validate(createBrandSchema), ctrl.create);
router.put('/brands/:id', authorize('ADMIN'), validate(updateBrandSchema), ctrl.update);
router.delete('/brands/:id', authorize('ADMIN'), ctrl.remove);

export default router;
