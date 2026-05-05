import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/authenticate';
import { createTransactionSchema, updateTransactionSchema } from '../validators/transaction.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Aggregation endpoints (must come before /:id to avoid route conflict)
router.get('/summary', TransactionController.getSummary);
router.get('/monthly-trend', TransactionController.getMonthlyTrend);
router.get('/by-category', TransactionController.getByCategory);
router.get('/export', TransactionController.exportCsv);

// CRUD
router.get('/', TransactionController.getAll);
router.get('/:id', TransactionController.getById);
router.post('/', validate(createTransactionSchema), TransactionController.create);
router.put('/:id', validate(updateTransactionSchema), TransactionController.update);
router.delete('/:id', TransactionController.delete);

export default router;
