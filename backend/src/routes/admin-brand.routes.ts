import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/admin-brand.controller';
import { createBrandSchema, updateBrandSchema } from '../validators/brand.validator';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/brands/list', ctrl.getList);
router.get('/brands', ctrl.getAll);
router.get('/brands/:id', ctrl.getById);
router.post('/brands', validate(createBrandSchema), ctrl.create);
router.put('/brands/:id', validate(updateBrandSchema), ctrl.update);
router.delete('/brands/:id', ctrl.remove);

export default router;
