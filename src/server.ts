import dotenv from 'dotenv';
import createApp, { printServerUrls } from './app';
import { sequelize } from './models';
import logger from './config/logger';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

const startServer = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('Database models synchronized');

    const app = createApp();

    app.listen(PORT, () => {
      logger.info({ port: PORT }, 'Server started');
      printServerUrls(PORT);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
