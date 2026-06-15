import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { unsignedInteger } from './dataTypes';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

export interface AccountAttributes {
  account_id: number;
  account_name: string;
  balance: number;
  status: AccountStatus;
  created_at: Date;
}

export type AccountCreationAttributes = Optional<
  AccountAttributes,
  'account_id' | 'balance' | 'status' | 'created_at'
>;

class Account
  extends Model<AccountAttributes, AccountCreationAttributes>
  implements AccountAttributes
{
  declare account_id: number;
  declare account_name: string;
  declare balance: number;
  declare status: AccountStatus;
  declare created_at: Date;
}

Account.init(
  {
    account_id: {
      type: unsignedInteger(),
      autoIncrement: true,
      primaryKey: true,
    },
    account_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'CLOSED'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'accounts',
    timestamps: false,
  }
);

export default Account;
