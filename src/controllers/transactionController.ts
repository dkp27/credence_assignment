import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import transactionService from '../services/transactionService';
import { isQueueEnabled } from '../config/rabbitmq';
import { ValidationError, ServiceUnavailableError } from '../utils/errors';
import logger from '../config/logger';

/**
 * @swagger
 * /api/v1/transactions:
 *   post:
 *     summary: Create a new transaction (DEBIT or CREDIT)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTransactionRequest'
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CreateTransactionResponse'
 *       400:
 *         description: Validation error or insufficient balance
 *       404:
 *         description: Account not found
 */
export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(
        'Validation failed',
        errors.array().map((e) => ({
          field: e.type === 'field' ? e.path : 'unknown',
          message: e.msg as string,
        }))
      );
    }

    const result = await transactionService.createTransaction(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/transactions/async:
 *   post:
 *     summary: Queue a transaction for async processing (Bonus — RabbitMQ)
 *     description: |
 *       Enqueues the transaction to RabbitMQ. A worker processes it and
 *       publishes events to consumer services (notification, analytics, audit).
 *       Requires `npm run worker` and RabbitMQ running.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTransactionRequest'
 *     responses:
 *       202:
 *         description: Transaction queued for processing
 *       503:
 *         description: Queue unavailable
 */
export const createTransactionAsync = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(
        'Validation failed',
        errors.array().map((e) => ({
          field: e.type === 'field' ? e.path : 'unknown',
          message: e.msg as string,
        }))
      );
    }

    if (!isQueueEnabled()) {
      throw new ServiceUnavailableError(
        'Queue is disabled. Set USE_QUEUE=true and start RabbitMQ.'
      );
    }

    const { enqueueTransaction } = await import('../queue/transactionQueue');
    const job = await enqueueTransaction(req.body, req.user?.username);

    res.status(202).json({
      success: true,
      data: {
        jobId: job.jobId,
        status: 'QUEUED',
        message: 'Transaction queued for processing',
        enqueuedAt: job.enqueuedAt,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('RabbitMQ'))
    ) {
      next(
        new ServiceUnavailableError(
          'RabbitMQ is not available. Run: npm run docker:infra && npm run worker'
        )
      );
      return;
    }
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/transactions:
 *   get:
 *     summary: List transactions with pagination, filtering and sorting
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [DEBIT, CREDIT]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SUCCESS, FAILED]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [transactionId, accountId, amount, transactionType, status, createdAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Paginated list of transactions
 */
export const listTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await transactionService.listTransactions({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      accountId: req.query.accountId ? Number(req.query.accountId) : undefined,
      transactionType: req.query.transactionType as 'DEBIT' | 'CREDIT' | undefined,
      status: req.query.status as 'PENDING' | 'SUCCESS' | 'FAILED' | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      fromDate: req.query.fromDate as string | undefined,
      toDate: req.query.toDate as string | undefined,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/accounts/{accountId}/summary:
 *   get:
 *     summary: Get account summary with balance and transaction totals
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Account summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AccountSummary'
 *       404:
 *         description: Account not found
 */
export const getAccountSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accountId = Number(req.params.accountId);

    if (isNaN(accountId) || accountId <= 0) {
      throw new ValidationError('Invalid account ID', [
        { field: 'accountId', message: 'Account ID must be a positive integer' },
      ]);
    }

    const result = await transactionService.getAccountSummary(accountId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const healthCheck = (_req: Request, res: Response): void => {
  logger.debug('Health check requested');
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
};
