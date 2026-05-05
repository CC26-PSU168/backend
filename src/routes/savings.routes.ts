import { Router } from 'express';
import { SavingsController } from '../controllers/savings.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/authenticate';
import { createGoalSchema, updateGoalSchema, depositWithdrawSchema } from '../validators/savings.validator';

const router = Router();

router.use(authenticate);

router.get('/', SavingsController.getAll);
router.post('/', validate(createGoalSchema), SavingsController.create);
router.put('/:id', validate(updateGoalSchema), SavingsController.update);
router.delete('/:id', SavingsController.delete);
router.post('/:id/deposit', validate(depositWithdrawSchema), SavingsController.deposit);
router.post('/:id/withdraw', validate(depositWithdrawSchema), SavingsController.withdraw);

export default router;
