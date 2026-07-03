import { Router } from 'express';
import { getWishlist, addItem, removeItem } from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/wishlist', getWishlist);
router.post('/wishlist', addItem);
router.delete('/wishlist/:productId', removeItem);

export default router;
