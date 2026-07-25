import { Router } from 'express';
import { getCart, addItem, updateItem, removeItem } from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { addToCartSchema, updateCartItemSchema } from '../validators/cart.validator';

const router = Router();

router.get('/cart', authenticate, getCart);
router.post('/cart/items', authenticate, validate(addToCartSchema), addItem);
router.put('/cart/items/:itemId', authenticate, validate(updateCartItemSchema), updateItem);
router.delete('/cart/items/:itemId', authenticate, removeItem);

export default router;
