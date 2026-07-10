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

router.get('/admin/products', ctrl.getAll);
router.get('/admin/products/:id', ctrl.getById);
router.post('/admin/products', validate(createProductSchema), ctrl.create);
router.put('/admin/products/:id', validate(updateProductSchema), ctrl.update);
router.delete('/admin/products/:id', ctrl.remove);

router.get('/admin/categories/flat', categoryCtrl.getFlat);
router.get('/admin/categories', categoryCtrl.getTree);
router.get('/admin/categories/:id', categoryCtrl.getById);
router.post('/admin/categories', validate(createCategorySchema), categoryCtrl.create);
router.put('/admin/categories/:id', validate(updateCategorySchema), categoryCtrl.update);
router.delete('/admin/categories/:id', categoryCtrl.remove);

router.get('/admin/brands', ctrl.getBrands);

export default router;
