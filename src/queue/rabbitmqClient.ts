import amqp, { Channel } from 'amqplib';
import { getRabbitMqUrl } from '../config/rabbitmq';
import logger from '../config/logger';
import {
  TRANSACTION_QUEUE,
  EVENTS_EXCHANGE,
  NOTIFICATION_QUEUE,
  ANALYTICS_QUEUE,
  AUDIT_QUEUE,
  ROUTING_KEY_COMPLETED,
  ROUTING_KEY_FAILED,
  ROUTING_KEY_ALL,
} from './constants';

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;

let connection: AmqpConnection | null = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<Channel> => {
  if (channel) {
    return channel;
  }

  const url = getRabbitMqUrl();
  connection = await amqp.connect(url);
  channel = await connection.createChannel();

  await channel.assertExchange(EVENTS_EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(TRANSACTION_QUEUE, { durable: true });
  await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });
  await channel.assertQueue(ANALYTICS_QUEUE, { durable: true });
  await channel.assertQueue(AUDIT_QUEUE, { durable: true });

  await channel.bindQueue(NOTIFICATION_QUEUE, EVENTS_EXCHANGE, ROUTING_KEY_COMPLETED);
  await channel.bindQueue(ANALYTICS_QUEUE, EVENTS_EXCHANGE, ROUTING_KEY_COMPLETED);
  await channel.bindQueue(AUDIT_QUEUE, EVENTS_EXCHANGE, ROUTING_KEY_ALL);

  connection.on('error', (err: Error) => {
    logger.error({ err }, 'RabbitMQ connection error');
  });

  connection.on('close', () => {
    logger.warn('RabbitMQ connection closed');
    connection = null;
    channel = null;
  });

  logger.info('RabbitMQ connected and topology asserted');
  return channel;
};

export const getChannel = (): Channel => {
  if (!channel) {
    throw new Error('RabbitMQ not connected. Call connectRabbitMQ() first.');
  }
  return channel;
};

export const closeRabbitMQ = async (): Promise<void> => {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
};
