import { Router } from 'express';
import { ScheduledPaymentController } from '../controllers/scheduledpayment.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/authenticate';
import { createScheduledPaymentSchema, updateScheduledPaymentSchema } from '../validators/scheduledpayment.validator';

const router = Router();

router.use(authenticate);

router.get('/', ScheduledPaymentController.getAll);
router.post('/', validate(createScheduledPaymentSchema), ScheduledPaymentController.create);
router.put('/:id', validate(updateScheduledPaymentSchema), ScheduledPaymentController.update);
router.patch('/:id/toggle', ScheduledPaymentController.toggleActive);
router.patch('/:id/mark-paid', ScheduledPaymentController.markPaid);
router.delete('/:id', ScheduledPaymentController.delete);

export default router;
