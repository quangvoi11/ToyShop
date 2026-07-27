import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/admin-article.controller';
import { createArticleSchema, updateArticleSchema } from '../validators/article.validator';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/articles', ctrl.getAll);
router.get('/articles/:id', ctrl.getById);
router.post('/articles', validate(createArticleSchema), ctrl.create);
router.put('/articles/:id', validate(updateArticleSchema), ctrl.update);
router.delete('/articles/:id', ctrl.remove);
router.patch('/articles/:id/publish', ctrl.togglePublish);

export default router;
