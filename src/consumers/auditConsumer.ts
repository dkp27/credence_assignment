import { connectRabbitMQ } from '../queue/rabbitmqClient';
import { AUDIT_QUEUE } from '../queue/constants';
import { TransactionEvent } from '../queue/eventBus';
import logger from '../config/logger';

export const startAuditConsumer = async (): Promise<void> => {
  const ch = await connectRabbitMQ();

  logger.info({ queue: AUDIT_QUEUE }, 'Audit consumer started');

  await ch.consume(AUDIT_QUEUE, (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString()) as TransactionEvent;

    logger.info(
      {
        service: 'audit',
        eventType: event.eventType,
        jobId: event.jobId,
        accountId: event.accountId,
      },
      `[Audit] Persist audit log for ${event.eventType}`
    );

    ch.ack(msg);
  });
};
