import { Transaction as SequelizeTransaction, Op, WhereOptions } from 'sequelize';
import { Account, Transaction, sequelize } from '../models';
import {
  CreateTransactionInput,
  CreateTransactionResult,
  TransactionListQuery,
  TransactionListItem,
  PaginatedResult,
  AccountSummaryResult,
} from '../types';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import logger from '../config/logger';

const SORTABLE_FIELDS: Record<string, string> = {
  transactionId: 'transaction_id',
  accountId: 'account_id',
  amount: 'amount',
  transactionType: 'transaction_type',
  status: 'status',
  createdAt: 'created_at',
};

export class TransactionService {
  async createTransaction(
    input: CreateTransactionInput
  ): Promise<CreateTransactionResult> {
    const { accountId, amount, transactionType } = input;

    if (amount <= 0) {
      throw new ValidationError('Amount must be greater than zero', [
        { field: 'amount', message: 'Amount must be greater than zero' },
      ]);
    }

    const dbTransaction = await sequelize.transaction();
    let committed = false;

    try {
      const account = await Account.findByPk(accountId, {
        lock: SequelizeTransaction.LOCK.UPDATE,
        transaction: dbTransaction,
      });

      if (!account) {
        throw new NotFoundError(`Account with id ${accountId} not found`);
      }

      if (account.status !== 'ACTIVE') {
        throw new ForbiddenError(
          `Account ${accountId} is ${account.status.toLowerCase()} and cannot process transactions`
        );
      }

      const currentBalance = Number(account.balance);

      if (transactionType === 'DEBIT' && currentBalance < amount) {
        const failedTxn = await Transaction.create(
          {
            account_id: accountId,
            amount,
            transaction_type: 'DEBIT',
            status: 'FAILED',
          },
          { transaction: dbTransaction }
        );

        await dbTransaction.commit();
        committed = true;

        logger.warn(
          { accountId, amount, transactionId: failedTxn.transaction_id },
          'Transaction failed: insufficient balance'
        );

        throw new ValidationError('Insufficient balance', [
          { field: 'amount', message: 'Insufficient balance for debit transaction' },
        ]);
      }

      const newBalance =
        transactionType === 'DEBIT'
          ? currentBalance - amount
          : currentBalance + amount;

      await account.update(
        { balance: newBalance },
        { transaction: dbTransaction }
      );

      const transaction = await Transaction.create(
        {
          account_id: accountId,
          amount,
          transaction_type: transactionType,
          status: 'SUCCESS',
        },
        { transaction: dbTransaction }
      );

      await dbTransaction.commit();
      committed = true;

      logger.info(
        {
          transactionId: transaction.transaction_id,
          accountId,
          amount,
          transactionType,
          updatedBalance: newBalance,
        },
        'Transaction created successfully'
      );

      return {
        transactionId: transaction.transaction_id,
        status: 'SUCCESS',
        updatedBalance: newBalance,
      };
    } catch (error) {
      if (!committed) {
        await dbTransaction.rollback();
      }
      throw error;
    }
  }

  async listTransactions(
    query: TransactionListQuery
  ): Promise<PaginatedResult<TransactionListItem>> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;

    const sortField = SORTABLE_FIELDS[query.sortBy || 'createdAt'] || 'created_at';
    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const where: WhereOptions = {};

    if (query.accountId) {
      where.account_id = query.accountId;
    }
    if (query.transactionType) {
      where.transaction_type = query.transactionType;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.fromDate || query.toDate) {
      const dateFilter: { [Op.gte]?: Date; [Op.lte]?: Date } = {};
      if (query.fromDate) {
        dateFilter[Op.gte] = new Date(query.fromDate);
      }
      if (query.toDate) {
        dateFilter[Op.lte] = new Date(query.toDate);
      }
      where.created_at = dateFilter;
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      order: [[sortField, sortOrder]],
      limit,
      offset,
    });

    const data: TransactionListItem[] = rows.map((txn) => ({
      transactionId: txn.transaction_id,
      accountId: txn.account_id,
      amount: Number(txn.amount),
      transactionType: txn.transaction_type,
      status: txn.status,
      createdAt: txn.created_at,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        totalRecords: count,
        totalPages: Math.ceil(count / limit) || 0,
      },
    };
  }

  async getAccountSummary(accountId: number): Promise<AccountSummaryResult> {
    const account = await Account.findByPk(accountId);

    if (!account) {
      throw new NotFoundError(`Account with id ${accountId} not found`);
    }

    const transactions = await Transaction.findAll({
      where: {
        account_id: accountId,
        status: 'SUCCESS',
      },
      attributes: ['amount', 'transaction_type'],
    });

    let totalCredit = 0;
    let totalDebit = 0;

    for (const txn of transactions) {
      const amount = Number(txn.amount);
      if (txn.transaction_type === 'CREDIT') {
        totalCredit += amount;
      } else {
        totalDebit += amount;
      }
    }

    return {
      accountId: account.account_id,
      currentBalance: round2(Number(account.balance)),
      totalCredit: round2(totalCredit),
      totalDebit: round2(totalDebit),
      transactionCount: transactions.length,
    };
  }
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export default new TransactionService();
