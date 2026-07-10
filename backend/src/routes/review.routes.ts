import { Router } from 'express';
import { getProductReviews, createReview } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createReviewSchema } from '../validators/review.validator';

const router = Router();

router.get('/products/:productId/reviews', getProductReviews);
router.post('/products/:productId/reviews', authenticate, validate(createReviewSchema), createReview);

export default router;
