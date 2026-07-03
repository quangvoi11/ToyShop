import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import cartRoutes from './cart.routes';
import wishlistRoutes from './wishlist.routes';
import orderRoutes from './order.routes';
import addressRoutes from './address.routes';

const router = Router();

router.use(healthRoutes);
router.use(authRoutes);
router.use(categoryRoutes);
router.use(productRoutes);
router.use(cartRoutes);
router.use(wishlistRoutes);
router.use(orderRoutes);
router.use(addressRoutes);

export default router;
