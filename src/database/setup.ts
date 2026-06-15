import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { sequelize } from '../models';
import logger from '../config/logger';
import { getDbConfig, resolveDbHost } from '../config/dbEnv';
import { runSeed } from './seedData';
import {
  printSetupHeader,
  printStep,
  printSuccess,
  printSkip,
  printSetupComplete,
  printSetupFailed,
} from './console';

dotenv.config();

// Use plain console output for setup (not JSON logs)
process.env.LOG_LEVEL = 'error';

const TOTAL_STEPS = 4;

const printMysqlHelp = (host: string, port: number): void => {
  console.error('\n--- MySQL connection failed ---');
  console.error(`Could not connect to MySQL at ${host}:${port}`);
  console.error('\nMySQL is not running. Choose one option:\n');
  console.error('  Option A — Docker:');
  console.error('    npm run docker:db');
  console.error('    npm run setup\n');
  console.error('  Option B — Local MySQL:');
  console.error('    sudo systemctl start mysql');
  console.error('    npm run setup\n');
  console.error('  Update .env:');
  console.error('    DB_HOST=127.0.0.1');
  console.error('    DB_PASSWORD=your_mysql_root_password\n');
};

const printAccessDeniedHelp = (username: string): void => {
  console.error('\n--- MySQL access denied ---');
  console.error(`User "${username}" login failed — wrong DB_PASSWORD in .env\n`);
  console.error('  1. Test password:  mysql -u root -p -h 127.0.0.1');
  console.error('  2. Update .env:    DB_PASSWORD=<your_actual_password>');
  console.error('  3. Verify:         npm run db:test\n');
};

const ensureDatabase = async (): Promise<{ dbName: string; created: boolean }> => {
  const { host: rawHost, port, username, password, database } = getDbConfig();
  const host = resolveDbHost(rawHost);

  const connection = await mysql.createConnection({
    host,
    port,
    user: username,
    password,
  });

  const [rows] = await connection.query(
    `SHOW DATABASES LIKE ?`,
    [database]
  ) as [Array<{ Database: string }>, unknown];

  const exists = rows.length > 0;

  if (!exists) {
    await connection.query(
      `CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  }

  await connection.end();
  return { dbName: database, created: !exists };
};

const runMigrations = async (): Promise<void> => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
};

const setup = async (): Promise<void> => {
  const { host: rawHost, port, database } = getDbConfig();
  const host = resolveDbHost(rawHost);

  printSetupHeader();

  try {
    if (process.env.NODE_ENV === 'test') {
      printSkip('Skipped — test environment does not use MySQL');
      process.exit(0);
    }

    // Step 1: Connect to MySQL
    printStep(1, TOTAL_STEPS, 'Connecting to MySQL server...');
    await mysql.createConnection({
      host,
      port,
      user: getDbConfig().username,
      password: getDbConfig().password,
    }).then((conn) => conn.end());
    printSuccess(`Connected to MySQL at ${host}:${port}`);

    // Step 2: Create database (only if it does not exist)
    printStep(2, TOTAL_STEPS, 'Checking database...');
    const { dbName, created: dbCreated } = await ensureDatabase();
    if (dbCreated) {
      printSuccess(`Database "${dbName}" created`);
    } else {
      printSkip(`Database "${dbName}" already exists — not created again`);
    }

    // Step 3: Run migrations
    printStep(3, TOTAL_STEPS, 'Running migrations (creating tables)...');
    await runMigrations();
    printSuccess('Tables ready: users, accounts, transactions');

    // Step 4: Seed data
    printStep(4, TOTAL_STEPS, 'Seeding sample data...');
    const forceSeed = process.env.SEED_FORCE === 'true';
    const seedResult = await runSeed(forceSeed);

    if (seedResult.seeded) {
      printSuccess(
        `Inserted ${seedResult.users} users, ${seedResult.accounts} accounts, ${seedResult.transactions} transactions`
      );
      printSuccess(`Demo account ID ${101} ready (assignment document example)`);
    } else {
      printSkip('Data already exists — skipped (use SEED_FORCE=true to re-seed)');
    }

    await sequelize.close();
    printSetupComplete(dbCreated, seedResult.seeded, seedResult.seeded ? {
      accounts: seedResult.accounts!,
      transactions: seedResult.transactions!,
    } : undefined);
    process.exit(0);
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { code?: string };
    const { username } = getDbConfig();

    printSetupFailed();

    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      printMysqlHelp(host, port);
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      printAccessDeniedHelp(username);
    } else {
      console.error(`Error: ${err.message}`);
    }

    logger.error({ err: error }, 'Setup failed');
    process.exit(1);
  }
};

setup();
