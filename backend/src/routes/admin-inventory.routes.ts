import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/admin-inventory.controller';
import { adjustStockSchema, createBatchSchema, updateBatchSchema } from '../validators/inventory.validator';
import { createWarehouseSchema, updateWarehouseSchema } from '../validators/warehouse.validator';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'STAFF'));

router.get('/inventory', ctrl.getStockOverview);
router.post('/inventory/adjust', validate(adjustStockSchema), ctrl.adjustStock);
router.get('/inventory/movements', ctrl.getMovements);
router.get('/inventory/movements/:id', ctrl.getMovementById);

router.get('/warehouses', ctrl.getAllWarehouses);
router.post('/warehouses', validate(createWarehouseSchema), ctrl.createWarehouse);
router.put('/warehouses/:id', validate(updateWarehouseSchema), ctrl.updateWarehouse);
router.delete('/warehouses/:id', ctrl.deactivateWarehouse);

router.get('/batches', ctrl.getAllBatches);
router.post('/batches', validate(createBatchSchema), ctrl.createBatch);
router.put('/batches/:id', validate(updateBatchSchema), ctrl.updateBatch);

export default router;
