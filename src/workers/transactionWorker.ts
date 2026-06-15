import { connectRabbitMQ } from '../queue/rabbitmqClient';
import { TRANSACTION_QUEUE } from '../queue/constants';
import { TransactionJobMessage } from '../queue/transactionQueue';
import transactionService from '../services/transactionService';
import {
  publishTransactionCompleted,
  publishTransactionFailed,
} from '../queue/eventBus';
import { AppError } from '../utils/errors';
import logger from '../config/logger';

export const startTransactionWorker = async (): Promise<void> => {
  const ch = await connectRabbitMQ();

  await ch.prefetch(1);

  logger.info({ queue: TRANSACTION_QUEUE }, 'Transaction worker started');

  await ch.consume(TRANSACTION_QUEUE, async (msg) => {
    if (!msg) return;

    const job = JSON.parse(msg.content.toString()) as TransactionJobMessage;

    try {
      logger.info({ jobId: job.jobId, payload: job.payload }, 'Processing transaction job');

      const result = await transactionService.createTransaction(job.payload);

      await publishTransactionCompleted(job.jobId, job.payload, result);

      logger.info({ jobId: job.jobId, result }, 'Transaction job completed');
      ch.ack(msg);
    } catch (error) {
      const message =
        error instanceof AppError ? error.message : 'Transaction processing failed';

      await publishTransactionFailed(job.jobId, job.payload, message);

      logger.error({ jobId: job.jobId, err: error }, 'Transaction job failed');
      ch.ack(msg);
    }
  });
};
