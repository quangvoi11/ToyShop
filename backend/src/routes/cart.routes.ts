import { Router } from 'express';
import { getCart, addItem, updateItem, removeItem } from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { addToCartSchema, updateCartItemSchema } from '../validators/cart.validator';

const router = Router();

router.use(authenticate);
router.get('/cart', getCart);
router.post('/cart/items', validate(addToCartSchema), addItem);
router.put('/cart/items/:itemId', validate(updateCartItemSchema), updateItem);
router.delete('/cart/items/:itemId', removeItem);

export default router;
