import dotenv from 'dotenv';

dotenv.config();

export const getRabbitMqUrl = (): string =>
  process.env.RABBITMQ_URL || 'amqp://guest:guest@127.0.0.1:5672';

export const isQueueEnabled = (): boolean =>
  process.env.USE_QUEUE !== 'false';
