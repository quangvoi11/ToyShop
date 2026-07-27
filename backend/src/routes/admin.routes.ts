import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/admin-product.controller';
import * as categoryCtrl from '../controllers/admin-category.controller';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/products', ctrl.getAll);
router.get('/products/:id', ctrl.getById);
router.post('/products', validate(createProductSchema), ctrl.create);
router.put('/products/:id', validate(updateProductSchema), ctrl.update);
router.delete('/products/:id', ctrl.remove);

router.get('/categories/flat', categoryCtrl.getFlat);
router.get('/categories', categoryCtrl.getTree);
router.get('/categories/:id', categoryCtrl.getById);
router.post('/categories', validate(createCategorySchema), categoryCtrl.create);
router.put('/categories/:id', validate(updateCategorySchema), categoryCtrl.update);
router.delete('/categories/:id', categoryCtrl.remove);

export default router;
