import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/authenticate';
import { createBudgetSchema, updateBudgetSchema } from '../validators/budget.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Aggregation
router.get('/overview', BudgetController.getOverview);

// CRUD
router.get('/', BudgetController.getAll);
router.post('/', validate(createBudgetSchema), BudgetController.create);
router.put('/:id', validate(updateBudgetSchema), BudgetController.update);
router.delete('/:id', BudgetController.delete);

export default router;
