import request from 'supertest';
import { getTestApp, resetTransactions, authHeader } from './helpers/testApp';
import { Account, Transaction } from '../src/models';

describe('POST /api/v1/transactions', () => {
  beforeEach(async () => {
    await resetTransactions();
  });

  it('should return 401 without auth token', async () => {
    const res = await request(getTestApp())
      .post('/api/v1/transactions')
      .send({ accountId: 1, amount: 100, transactionType: 'DEBIT' });

    expect(res.status).toBe(401);
  });

  it('should create a successful DEBIT transaction', async () => {
    const res = await request(getTestApp())
      .post('/api/v1/transactions')
      .set(authHeader())
      .send({
        accountId: 1,
        amount: 2000,
        transactionType: 'DEBIT',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      status: 'SUCCESS',
      updatedBalance: 8000,
    });
    expect(res.body.data.transactionId).toBeDefined();

    const account = await Account.findByPk(1);
    expect(Number(account?.balance)).toBe(8000);
  });

  it('should create a successful CREDIT transaction', async () => {
    const res = await request(getTestApp())
      .post('/api/v1/transactions')
      .set(authHeader())
      .send({
        accountId: 1,
        amount: 3000,
        transactionType: 'CREDIT',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.updatedBalance).toBe(13000);
  });

  it('should return 400 for insufficient balance', async () => {
    const res = await request(getTestApp())
      .post('/api/v1/transactions')
      .set(authHeader())
      .send({
        accountId: 1,
        amount: 15000,
        transactionType: 'DEBIT',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Insufficient balance');

    const failedTxn = await Transaction.findOne({
      where: { account_id: 1, status: 'FAILED' },
    });
    expect(failedTxn).not.toBeNull();
  });

  it('should return 404 for non-existent account', async () => {
    const res = await request(getTestApp())
      .post('/api/v1/transactions')
      .set(authHeader())
      .send({
        accountId: 999,
        amount: 100,
        transactionType: 'DEBIT',
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('not found');
  });

  it('should return 403 for suspended account', async () => {
    const res = await request(getTestApp())
      .post('/api/v1/transactions')
      .set(authHeader())
      .send({
        accountId: 3,
        amount: 100,
        transactionType: 'DEBIT',
      });

    expect(res.status).toBe(403);
  });

  it('should return 400 for invalid request body', async () => {
    const res = await request(getTestApp())
      .post('/api/v1/transactions')
      .set(authHeader())
      .send({
        accountId: 'invalid',
        amount: -100,
        transactionType: 'INVALID',
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});

describe('GET /api/v1/transactions', () => {
  beforeEach(async () => {
    await resetTransactions();
    await Transaction.bulkCreate([
      { account_id: 1, amount: 1000, transaction_type: 'CREDIT', status: 'SUCCESS' },
      { account_id: 1, amount: 500, transaction_type: 'DEBIT', status: 'SUCCESS' },
      { account_id: 2, amount: 2000, transaction_type: 'CREDIT', status: 'SUCCESS' },
    ]);
  });

  it('should return paginated transactions', async () => {
    const res = await request(getTestApp())
      .get('/api/v1/transactions')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.pagination).toMatchObject({
      page: 1,
      limit: 20,
      totalRecords: 3,
      totalPages: 1,
    });
  });

  it('should filter by accountId', async () => {
    const res = await request(getTestApp())
      .get('/api/v1/transactions')
      .set(authHeader())
      .query({ accountId: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((t: { accountId: number }) => t.accountId === 1)).toBe(true);
  });

  it('should filter by transactionType', async () => {
    const res = await request(getTestApp())
      .get('/api/v1/transactions')
      .set(authHeader())
      .query({ transactionType: 'DEBIT' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].transactionType).toBe('DEBIT');
  });

  it('should support pagination', async () => {
    const res = await request(getTestApp())
      .get('/api/v1/transactions')
      .set(authHeader())
      .query({ page: 1, limit: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.totalPages).toBe(2);
  });
});

describe('GET /api/v1/accounts/:accountId/summary', () => {
  beforeEach(async () => {
    await resetTransactions();
    await Transaction.bulkCreate([
      { account_id: 1, amount: 5000, transaction_type: 'CREDIT', status: 'SUCCESS' },
      { account_id: 1, amount: 2000, transaction_type: 'DEBIT', status: 'SUCCESS' },
      { account_id: 1, amount: 1000, transaction_type: 'DEBIT', status: 'FAILED' },
    ]);
  });

  it('should return account summary', async () => {
    const res = await request(getTestApp())
      .get('/api/v1/accounts/1/summary')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      accountId: 1,
      currentBalance: 10000,
      totalCredit: 5000,
      totalDebit: 2000,
      transactionCount: 2,
    });
  });

  it('should return 404 for non-existent account', async () => {
    const res = await request(getTestApp())
      .get('/api/v1/accounts/999/summary')
      .set(authHeader());

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/health', () => {
  it('should return healthy status', async () => {
    const res = await request(getTestApp()).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('healthy');
  });
});
