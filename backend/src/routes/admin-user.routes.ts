import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/admin-user.controller';
import { updateUserStatusSchema, updateUserRoleSchema } from '../validators/user.validator';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/users', ctrl.getAll);
router.get('/users/:id', ctrl.getById);
router.patch('/users/:id/status', validate(updateUserStatusSchema), ctrl.updateStatus);
router.patch('/users/:id/role', validate(updateUserRoleSchema), ctrl.updateRole);

export default router;
