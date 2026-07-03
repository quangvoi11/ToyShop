import { Router } from 'express';
import { getAll, getBySlug, getFeatured } from '../controllers/product.controller';

const router = Router();

router.get('/products', getAll);
router.get('/products/featured', getFeatured);
router.get('/products/:slug', getBySlug);

export default router;
