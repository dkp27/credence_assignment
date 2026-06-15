import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Account from './Account';
import { unsignedInteger } from './dataTypes';

export type TransactionType = 'DEBIT' | 'CREDIT';
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface TransactionAttributes {
  transaction_id: number;
  account_id: number;
  amount: number;
  transaction_type: TransactionType;
  status: TransactionStatus;
  created_at: Date;
}

export type TransactionCreationAttributes = Optional<
  TransactionAttributes,
  'transaction_id' | 'status' | 'created_at'
>;

class Transaction
  extends Model<TransactionAttributes, TransactionCreationAttributes>
  implements TransactionAttributes
{
  declare transaction_id: number;
  declare account_id: number;
  declare amount: number;
  declare transaction_type: TransactionType;
  declare status: TransactionStatus;
  declare created_at: Date;
}

Transaction.init(
  {
    transaction_id: {
      type: unsignedInteger(),
      autoIncrement: true,
      primaryKey: true,
    },
    account_id: {
      type: unsignedInteger(),
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'account_id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    transaction_type: {
      type: DataTypes.ENUM('DEBIT', 'CREDIT'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'transactions',
    timestamps: false,
  }
);

Transaction.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });
Account.hasMany(Transaction, { foreignKey: 'account_id', as: 'transactions' });

export default Transaction;
