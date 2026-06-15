import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

/** INTEGER.UNSIGNED for MySQL, plain INTEGER for SQLite (tests) */
export const unsignedInteger = () =>
  sequelize.getDialect() === 'sqlite'
    ? DataTypes.INTEGER
    : DataTypes.INTEGER.UNSIGNED;
