import { Router } from 'express';
import { SplitBillController } from '../controllers/splitbill.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/authenticate';
import { createSplitBillSchema } from '../validators/splitbill.validator';

const router = Router();

router.use(authenticate);

router.get('/', SplitBillController.getAll);
router.post('/', validate(createSplitBillSchema), SplitBillController.create);
router.delete('/:id', SplitBillController.delete);
router.patch('/:id/participants/:participantId/pay', SplitBillController.markParticipantPaid);
router.patch('/:id/settle', SplitBillController.settleBill);

export default router;
