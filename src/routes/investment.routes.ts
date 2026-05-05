import { Router } from 'express';
import { InvestmentController } from '../controllers/investment.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

router.use(authenticate);

router.get('/prices', InvestmentController.getPrices);

export default router;
