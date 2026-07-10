import { Router } from 'express';
import { getById, getAddresses, create, update, remove } from '../controllers/address.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createAddressSchema } from '../validators/address.validator';

const router = Router();

router.use(authenticate);
router.get('/addresses', getAddresses);
router.get('/addresses/:id', getById);
router.post('/addresses', validate(createAddressSchema), create);
router.put('/addresses/:id', validate(createAddressSchema.partial()), update);
router.delete('/addresses/:id', remove);

export default router;
