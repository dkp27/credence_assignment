import { connectRabbitMQ } from './rabbitmqClient';
import {
  EVENTS_EXCHANGE,
  ROUTING_KEY_COMPLETED,
  ROUTING_KEY_FAILED,
} from './constants';
import { CreateTransactionInput, CreateTransactionResult } from '../types';

export interface TransactionCompletedEvent {
  eventType: 'transaction.completed';
  jobId: string;
  accountId: number;
  amount: number;
  transactionType: string;
  result: CreateTransactionResult;
  processedAt: string;
}

export interface TransactionFailedEvent {
  eventType: 'transaction.failed';
  jobId: string;
  accountId: number;
  amount: number;
  transactionType: string;
  error: string;
  processedAt: string;
}

export type TransactionEvent = TransactionCompletedEvent | TransactionFailedEvent;

export const publishTransactionCompleted = async (
  jobId: string,
  payload: CreateTransactionInput,
  result: CreateTransactionResult
): Promise<void> => {
  const ch = await connectRabbitMQ();

  const event: TransactionCompletedEvent = {
    eventType: 'transaction.completed',
    jobId,
    accountId: payload.accountId,
    amount: payload.amount,
    transactionType: payload.transactionType,
    result,
    processedAt: new Date().toISOString(),
  };

  ch.publish(
    EVENTS_EXCHANGE,
    ROUTING_KEY_COMPLETED,
    Buffer.from(JSON.stringify(event)),
    { persistent: true, contentType: 'application/json' }
  );
};

export const publishTransactionFailed = async (
  jobId: string,
  payload: CreateTransactionInput,
  errorMessage: string
): Promise<void> => {
  const ch = await connectRabbitMQ();

  const event: TransactionFailedEvent = {
    eventType: 'transaction.failed',
    jobId,
    accountId: payload.accountId,
    amount: payload.amount,
    transactionType: payload.transactionType,
    error: errorMessage,
    processedAt: new Date().toISOString(),
  };

  ch.publish(
    EVENTS_EXCHANGE,
    ROUTING_KEY_FAILED,
    Buffer.from(JSON.stringify(event)),
    { persistent: true, contentType: 'application/json' }
  );
};
