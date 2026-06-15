import { connectRabbitMQ } from '../queue/rabbitmqClient';
import { NOTIFICATION_QUEUE } from '../queue/constants';
import { TransactionEvent } from '../queue/eventBus';
import logger from '../config/logger';

export const startNotificationConsumer = async (): Promise<void> => {
  const ch = await connectRabbitMQ();

  logger.info({ queue: NOTIFICATION_QUEUE }, 'Notification consumer started');

  await ch.consume(NOTIFICATION_QUEUE, (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString()) as TransactionEvent;

    if (event.eventType === 'transaction.completed') {
      logger.info(
        {
          service: 'notification',
          jobId: event.jobId,
          accountId: event.accountId,
          transactionId: event.result.transactionId,
        },
        `[Notification] Transaction successful — notify customer for account ${event.accountId}`
      );
    }

    ch.ack(msg);
  });
};
