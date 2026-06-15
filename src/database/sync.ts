import dotenv from 'dotenv';
import { sequelize } from '../models';
import logger from '../config/logger';

dotenv.config();

const syncDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false, alter: true });
    logger.info('Database synced successfully');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Database sync failed');
    process.exit(1);
  }
};

syncDatabase();
