import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import logger from './logger';
import { getDbConfig } from './dbEnv';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

const sequelize = isTest
  ? new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
      define: {
        timestamps: false,
        underscored: true,
      },
    })
  : new Sequelize({
      dialect: 'mysql',
      ...getDbConfig(),
      logging: (msg: string) => logger.debug({ sql: msg }, 'sequelize query'),
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: false,
        underscored: true,
      },
    });

export default sequelize;
