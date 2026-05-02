import { Router } from 'express';
import authRoutes from './auth.routes';
import transactionRoutes from './transaction.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'KampusCuan API is running 🚀' });
});

// Auth
router.use('/auth', authRoutes);

// Transactions
router.use('/transactions', transactionRoutes);

// Placeholder routes — akan diimplementasi di Phase 3+
// router.use('/budgets', budgetRoutes);
// router.use('/savings', savingsRoutes);
// router.use('/split-bills', splitBillRoutes);
// router.use('/ai', aiRoutes);
// router.use('/investment', investmentRoutes);
// router.use('/profile', profileRoutes);
// router.use('/notifications', notificationRoutes);

export default router;

