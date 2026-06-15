import dotenv from 'dotenv';

dotenv.config();

/** Use 127.0.0.1 instead of localhost to avoid IPv6 (::1) connection issues on Linux */
export const resolveDbHost = (host?: string): string => {
  const value = host || process.env.DB_HOST || '127.0.0.1';
  return value === 'localhost' ? '127.0.0.1' : value;
};

export const getDbConfig = () => ({
  host: resolveDbHost(),
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'credence_db',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
});
