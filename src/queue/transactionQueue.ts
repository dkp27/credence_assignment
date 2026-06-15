import { randomUUID } from 'crypto';
import { connectRabbitMQ } from './rabbitmqClient';
import { TRANSACTION_QUEUE } from './constants';
import { CreateTransactionInput } from '../types';

export interface TransactionJobMessage {
  jobId: string;
  payload: CreateTransactionInput;
  requestedBy?: string;
  enqueuedAt: string;
}

export const enqueueTransaction = async (
  payload: CreateTransactionInput,
  requestedBy?: string
): Promise<TransactionJobMessage> => {
  const ch = await connectRabbitMQ();

  const job: TransactionJobMessage = {
    jobId: randomUUID(),
    payload,
    requestedBy,
    enqueuedAt: new Date().toISOString(),
  };

  ch.sendToQueue(TRANSACTION_QUEUE, Buffer.from(JSON.stringify(job)), {
    persistent: true,
    contentType: 'application/json',
    messageId: job.jobId,
  });

  return job;
};
