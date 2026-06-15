-- Credence Transaction Management Service
-- MySQL Database Schema

CREATE DATABASE IF NOT EXISTS credence_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE credence_db;

-- -----------------------------------------------------
-- Table: users
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50) NOT NULL,
  email         VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uk_users_username (username),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------
-- Table: accounts
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
  account_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_name VARCHAR(100) NOT NULL,
  balance      DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  status       ENUM('ACTIVE', 'SUSPENDED', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id),
  CONSTRAINT chk_balance_non_negative CHECK (balance >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------
-- Table: transactions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id       INT UNSIGNED NOT NULL,
  amount           DECIMAL(15, 2) NOT NULL,
  transaction_type ENUM('DEBIT', 'CREDIT') NOT NULL,
  status           ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (transaction_id),
  CONSTRAINT fk_transactions_account
    FOREIGN KEY (account_id) REFERENCES accounts (account_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_amount_positive CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------
-- Indexes (Performance)
-- -----------------------------------------------------
CREATE INDEX idx_transactions_account_created
  ON transactions (account_id, created_at DESC);

CREATE INDEX idx_transactions_status_type
  ON transactions (status, transaction_type);

CREATE INDEX idx_accounts_status
  ON accounts (status);

CREATE INDEX idx_users_email
  ON users (email);
