import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import cartRoutes from './cart.routes';
import wishlistRoutes from './wishlist.routes';
import orderRoutes from './order.routes';
import addressRoutes from './address.routes';
import adminRoutes from './admin.routes';
import adminOrderRoutes from './admin-order.routes';
import adminUserRoutes from './admin-user.routes';
import adminDashboardRoutes from './admin-dashboard.routes';
import adminCouponRoutes from './admin-coupon.routes';
import uploadRoutes from './upload.routes';
import reviewRoutes from './review.routes';
import couponRoutes from './coupon.routes';

const router = Router();

router.use(healthRoutes);
router.use(authRoutes);
router.use(categoryRoutes);
router.use(productRoutes);
router.use(cartRoutes);
router.use(wishlistRoutes);
router.use(orderRoutes);
router.use(addressRoutes);
router.use(adminRoutes);
router.use(adminOrderRoutes);
router.use(adminUserRoutes);
router.use(adminDashboardRoutes);
router.use(adminCouponRoutes);
router.use(uploadRoutes);
router.use(reviewRoutes);
router.use(couponRoutes);

export default router;
