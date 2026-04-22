import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'KampusCuan API is running 🚀' });
});

// Auth
router.use('/auth', authRoutes);

// Placeholder routes — akan diimplementasi di Phase 2-7
// router.use('/transactions', transactionRoutes);
// router.use('/budgets', budgetRoutes);
// router.use('/savings', savingsRoutes);
// router.use('/split-bills', splitBillRoutes);
// router.use('/ai', aiRoutes);
// router.use('/investment', investmentRoutes);
// router.use('/profile', profileRoutes);
// router.use('/notifications', notificationRoutes);

export default router;
