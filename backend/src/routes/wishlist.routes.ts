import { Router } from 'express';
import { getWishlist, addItem, removeItem } from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/wishlist', authenticate, getWishlist);
router.post('/wishlist', authenticate, addItem);
router.delete('/wishlist/:productId', authenticate, removeItem);

export default router;
