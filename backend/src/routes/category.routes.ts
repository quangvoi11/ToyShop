import { Router } from 'express';
import { getAll, getBySlug } from '../controllers/category.controller';

const router = Router();

router.get('/categories', getAll);
router.get('/categories/:slug', getBySlug);

export default router;
