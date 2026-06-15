import dotenv from 'dotenv';
import { sequelize } from './models';
import logger from './config/logger';
import { startTransactionWorker } from './workers/transactionWorker';
import { startNotificationConsumer } from './consumers/notificationConsumer';
import { startAnalyticsConsumer } from './consumers/analyticsConsumer';
import { startAuditConsumer } from './consumers/auditConsumer';
import { closeRabbitMQ } from './queue/rabbitmqClient';

dotenv.config();

const startWorkers = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Worker: database connected');

    await startTransactionWorker();
    await startNotificationConsumer();
    await startAnalyticsConsumer();
    await startAuditConsumer();

    console.log('');
    console.log('═'.repeat(50));
    console.log('  Credence Queue Workers — Running');
    console.log('═'.repeat(50));
    console.log('');
    console.log('  Flow: API → transaction.jobs → Worker → credence.events');
    console.log('  Consumers: notification | analytics | audit');
    console.log('');
    console.log('  RabbitMQ UI: http://localhost:15672 (guest/guest)');
    console.log('');
  } catch (error) {
    logger.error({ err: error }, 'Failed to start workers');
    process.exit(1);
  }
};

startWorkers();

const shutdown = async (): Promise<void> => {
  await closeRabbitMQ();
  await sequelize.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
