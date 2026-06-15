import { connectRabbitMQ } from '../queue/rabbitmqClient';
import { ANALYTICS_QUEUE } from '../queue/constants';
import { TransactionEvent } from '../queue/eventBus';
import logger from '../config/logger';

export const startAnalyticsConsumer = async (): Promise<void> => {
  const ch = await connectRabbitMQ();

  logger.info({ queue: ANALYTICS_QUEUE }, 'Analytics consumer started');

  await ch.consume(ANALYTICS_QUEUE, (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString()) as TransactionEvent;

    if (event.eventType === 'transaction.completed') {
      logger.info(
        {
          service: 'analytics',
          jobId: event.jobId,
          accountId: event.accountId,
          amount: event.amount,
          transactionType: event.transactionType,
        },
        `[Analytics] Record transaction metrics for reporting dashboard`
      );
    }

    ch.ack(msg);
  });
};
