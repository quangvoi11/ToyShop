import { Router } from 'express';
import { getById, getAddresses, create, update, remove } from '../controllers/address.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createAddressSchema, updateAddressSchema } from '../validators/address.validator';

const router = Router();

router.get('/addresses', authenticate, getAddresses);
router.get('/addresses/:id', authenticate, getById);
router.post('/addresses', authenticate, validate(createAddressSchema), create);
router.put('/addresses/:id', authenticate, validate(updateAddressSchema), update);
router.delete('/addresses/:id', authenticate, remove);

export default router;
