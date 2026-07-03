import { Router } from 'express';
import { getCart, addItem, updateItem, removeItem } from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/cart', getCart);
router.post('/cart/items', addItem);
router.put('/cart/items/:itemId', updateItem);
router.delete('/cart/items/:itemId', removeItem);

export default router;
