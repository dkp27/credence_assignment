import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { unsignedInteger } from './dataTypes';

export type UserRole = 'ADMIN' | 'USER';

export interface UserAttributes {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

export type UserCreationAttributes = Optional<
  UserAttributes,
  'user_id' | 'role' | 'created_at'
>;

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare user_id: number;
  declare username: string;
  declare email: string;
  declare password_hash: string;
  declare role: UserRole;
  declare created_at: Date;
}

User.init(
  {
    user_id: {
      type: unsignedInteger(),
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('ADMIN', 'USER'),
      allowNull: false,
      defaultValue: 'USER',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: false,
  }
);

export default User;
