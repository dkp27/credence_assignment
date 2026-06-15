import { Router } from 'express';
import {
  createTransaction,
  createTransactionAsync,
  listTransactions,
  getAccountSummary,
  healthCheck,
} from '../controllers/transactionController';
import { createTransactionValidation } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import authRoutes from './authRoutes';

const router = Router();

router.get('/health', healthCheck);

router.use('/auth', authRoutes);

router.post(
  '/transactions',
  authenticate,
  createTransactionValidation,
  createTransaction
);

router.post(
  '/transactions/async',
  authenticate,
  createTransactionValidation,
  createTransactionAsync
);

router.get('/transactions', authenticate, listTransactions);

router.get('/accounts/:accountId/summary', authenticate, getAccountSummary);

export default router;
