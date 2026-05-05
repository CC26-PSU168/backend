import { Router } from 'express';
import authRoutes from './auth.routes';
import transactionRoutes from './transaction.routes';
import budgetRoutes from './budget.routes';
import savingsRoutes from './savings.routes';
import splitBillRoutes from './splitbill.routes';
import scheduledPaymentRoutes from './scheduledpayment.routes';
import notificationRoutes from './notification.routes';
import profileRoutes from './profile.routes';
import investmentRoutes from './investment.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Budgetly API is running 🚀' });
});

// Auth
router.use('/auth', authRoutes);

// Transactions
router.use('/transactions', transactionRoutes);

// Budget
router.use('/budget', budgetRoutes);

// Savings
router.use('/savings', savingsRoutes);

// Split Bill
router.use('/split-bill', splitBillRoutes);

// Scheduled Payments
router.use('/scheduled-payments', scheduledPaymentRoutes);

// Notifications
router.use('/notifications', notificationRoutes);

// Profile
router.use('/profile', profileRoutes);

// Investment
router.use('/investment', investmentRoutes);

export default router;
