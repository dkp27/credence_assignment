import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { getDbConfig, resolveDbHost } from '../config/dbEnv';

dotenv.config();

const testConnection = async (): Promise<void> => {
  const { host: rawHost, port, username, password, database } = getDbConfig();
  const host = resolveDbHost(rawHost);

  console.log('');
  console.log('═'.repeat(50));
  console.log('  MySQL Connection Test');
  console.log('═'.repeat(50));
  console.log('');
  console.log(`Host:     ${host}:${port}`);
  console.log(`User:     ${username}`);
  console.log(`Database: ${database}`);
  console.log('');

  try {
    const connection = await mysql.createConnection({ host, port, user: username, password });
    const [rows] = await connection.query('SELECT VERSION() AS version') as [{ version: string }[], unknown];
    console.log('✓ Connection successful');
    console.log(`  MySQL version: ${rows[0].version}`);

    try {
      await connection.query(`USE \`${database}\``);
      console.log(`✓ Database "${database}" exists and is accessible`);
    } catch {
      console.log(`→ Database "${database}" does not exist yet (run: npm run setup)`);
    }

    await connection.end();
    console.log('');
    console.log('Credentials in .env are correct.');
    console.log('Run: npm run setup');
    console.log('');
    process.exit(0);
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { code?: string };
    console.log('✗ Connection failed');
    console.log(`  ${err.message}`);
    console.log('');

    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('Fix: update DB_PASSWORD in .env');
      console.log('Test: mysql -u root -p -h 127.0.0.1');
    } else if (err.code === 'ECONNREFUSED') {
      console.log('Fix: start MySQL → sudo systemctl start mysql');
    }
    console.log('');
    process.exit(1);
  }
};

testConnection();
