import dotenv from 'dotenv';
import { sequelize } from '../models';
import logger from '../config/logger';
import { runSeed } from './seedData';

dotenv.config();

const seedDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const forceSeed = process.env.SEED_FORCE === 'true';
    await runSeed(forceSeed);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Database seed failed');
    process.exit(1);
  }
};

seedDatabase();
