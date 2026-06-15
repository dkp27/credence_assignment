import { Application } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import createApp from '../../src/app';
import { Account, Transaction, User, sequelize } from '../../src/models';

let app: Application;
let authToken = '';

export const getTestApp = (): Application => app;

export const getAuthToken = (): string => authToken;

export const authHeader = (): { Authorization: string } => ({
  Authorization: `Bearer ${authToken}`,
});

export const setupTestDatabase = async (): Promise<void> => {
  await sequelize.sync({ force: true });

  const user = await User.create({
    username: 'testuser',
    email: 'test@test.com',
    password_hash: await bcrypt.hash('test123', 10),
    role: 'USER',
  });

  authToken = jwt.sign(
    { userId: user.user_id, username: user.username, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  await Account.bulkCreate([
    { account_name: 'Test Account 1', balance: 10000, status: 'ACTIVE' },
    { account_name: 'Test Account 2', balance: 5000, status: 'ACTIVE' },
    { account_name: 'Suspended Account', balance: 1000, status: 'SUSPENDED' },
  ]);
};

export const resetTransactions = async (): Promise<void> => {
  await Transaction.destroy({ where: {}, truncate: true });
  await Account.update({ balance: 10000 }, { where: { account_id: 1 } });
  await Account.update({ balance: 5000 }, { where: { account_id: 2 } });
};

beforeAll(async () => {
  app = createApp();
  await setupTestDatabase();
});

afterAll(async () => {
  await sequelize.close();
});
