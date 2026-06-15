import bcrypt from 'bcryptjs';
import { Account, Transaction, User, sequelize } from '../models';
import logger from '../config/logger';

export const seedUsers = [
  {
    username: 'admin',
    email: 'admin@credence.com',
    password: 'admin123',
    role: 'ADMIN' as const,
  },
  {
    username: 'john',
    email: 'john@example.com',
    password: 'password123',
    role: 'USER' as const,
  },
  {
    username: 'jane',
    email: 'jane@example.com',
    password: 'password123',
    role: 'USER' as const,
  },
  {
    username: 'operator',
    email: 'operator@credence.com',
    password: 'operator123',
    role: 'USER' as const,
  },
];

type TxnSeed = {
  account_id: number;
  amount: number;
  transaction_type: 'DEBIT' | 'CREDIT';
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
};

/** Assignment document account: id 101, balance 10000, credit 50000, debit 40000, 120 txns */
export const ASSIGNMENT_ACCOUNT_ID = 101;

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Split total into `count` positive amounts (in cents) that sum exactly to `total` */
const splitAmount = (total: number, count: number): number[] => {
  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / count);
  const amounts: number[] = [];
  let usedCents = 0;

  for (let i = 0; i < count - 1; i++) {
    amounts.push(baseCents / 100);
    usedCents += baseCents;
  }
  amounts.push((totalCents - usedCents) / 100);
  return amounts;
};

/** Account 101 — matches assignment document exactly */
const buildAssignmentAccount101Transactions = (): TxnSeed[] => {
  const txns: TxnSeed[] = [];

  const credits = splitAmount(50000, 60);
  const debits = splitAmount(40000, 60);

  for (const amount of credits) {
    txns.push({
      account_id: ASSIGNMENT_ACCOUNT_ID,
      amount,
      transaction_type: 'CREDIT',
      status: 'SUCCESS',
    });
  }

  for (const amount of debits) {
    txns.push({
      account_id: ASSIGNMENT_ACCOUNT_ID,
      amount,
      transaction_type: 'DEBIT',
      status: 'SUCCESS',
    });
  }

  txns.push(
    {
      account_id: ASSIGNMENT_ACCOUNT_ID,
      amount: 5000,
      transaction_type: 'DEBIT',
      status: 'FAILED',
    },
    {
      account_id: ASSIGNMENT_ACCOUNT_ID,
      amount: 2000,
      transaction_type: 'DEBIT',
      status: 'FAILED',
    }
  );

  return txns;
};

const additionalAccounts = [
  { account_id: 102, account_name: 'John Savings', balance: 50000, status: 'ACTIVE' as const },
  { account_id: 103, account_name: 'Jane Checking', balance: 25000, status: 'ACTIVE' as const },
  { account_id: 104, account_name: 'Corp Account', balance: 100000, status: 'ACTIVE' as const },
  { account_id: 105, account_name: 'Tech Startup', balance: 75000, status: 'ACTIVE' as const },
  { account_id: 106, account_name: 'Personal Wallet', balance: 12000, status: 'ACTIVE' as const },
  { account_id: 107, account_name: 'Family Joint Account', balance: 35000, status: 'ACTIVE' as const },
  { account_id: 108, account_name: 'Emergency Fund', balance: 8000, status: 'ACTIVE' as const },
  { account_id: 109, account_name: 'Investment Pool', balance: 200000, status: 'ACTIVE' as const },
  { account_id: 110, account_name: 'Retail Business', balance: 45000, status: 'ACTIVE' as const },
  { account_id: 111, account_name: 'Freelancer Account', balance: 18000, status: 'ACTIVE' as const },
  { account_id: 112, account_name: 'Education Fund', balance: 22000, status: 'ACTIVE' as const },
  { account_id: 113, account_name: 'Travel Budget', balance: 9500, status: 'ACTIVE' as const },
  { account_id: 114, account_name: 'Healthcare Savings', balance: 15000, status: 'ACTIVE' as const },
  { account_id: 115, account_name: 'Suspended User', balance: 5000, status: 'SUSPENDED' as const },
  { account_id: 116, account_name: 'Closed Account', balance: 0, status: 'CLOSED' as const },
];

const buildBulkTransactions = (): TxnSeed[] => {
  const txns: TxnSeed[] = [...buildAssignmentAccount101Transactions()];
  const types: Array<'DEBIT' | 'CREDIT'> = ['DEBIT', 'CREDIT'];
  const statuses: Array<'SUCCESS' | 'FAILED' | 'PENDING'> = [
    'SUCCESS',
    'SUCCESS',
    'SUCCESS',
    'SUCCESS',
    'FAILED',
  ];

  for (let accountId = 102; accountId <= 114; accountId++) {
    const txnCount = 15 + (accountId % 10);
    for (let i = 0; i < txnCount; i++) {
      txns.push({
        account_id: accountId,
        amount: round2(100 + ((accountId * 17 + i * 43) % 9900)),
        transaction_type: types[(accountId + i) % 2],
        status: statuses[(accountId + i) % statuses.length],
      });
    }
  }

  txns.push(
    { account_id: 115, amount: 2000, transaction_type: 'DEBIT', status: 'FAILED' },
    { account_id: 116, amount: 1000, transaction_type: 'CREDIT', status: 'SUCCESS' }
  );

  return txns;
};

export const seedAccounts = [
  {
    account_id: ASSIGNMENT_ACCOUNT_ID,
    account_name: 'Assignment Demo Account',
    balance: 10000,
    status: 'ACTIVE' as const,
  },
  ...additionalAccounts,
];

export interface SeedResult {
  seeded: boolean;
  users?: number;
  accounts?: number;
  transactions?: number;
}

export const runSeed = async (force = false): Promise<SeedResult> => {
  const accountCount = await Account.count();

  if (accountCount > 0 && !force) {
    return { seeded: false };
  }

  if (force) {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Transaction.destroy({ where: {}, truncate: true });
    await Account.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  const passwordHashes = await Promise.all(
    seedUsers.map((u) => bcrypt.hash(u.password, 10))
  );

  await User.bulkCreate(
    seedUsers.map((user, index) => ({
      username: user.username,
      email: user.email,
      password_hash: passwordHashes[index],
      role: user.role,
    }))
  );

  await Account.bulkCreate(seedAccounts);
  await sequelize.query('ALTER TABLE accounts AUTO_INCREMENT = 200');

  const transactions = buildBulkTransactions();
  await Transaction.bulkCreate(transactions);

  logger.info(
    {
      users: seedUsers.length,
      accounts: seedAccounts.length,
      transactions: transactions.length,
      assignmentAccountId: ASSIGNMENT_ACCOUNT_ID,
    },
    'Database seeded successfully'
  );

  return {
    seeded: true,
    users: seedUsers.length,
    accounts: seedAccounts.length,
    transactions: transactions.length,
  };
};
