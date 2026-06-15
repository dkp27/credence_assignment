-- Credence Transaction Management Service
-- Seed Data (passwords are bcrypt hashes for reference only — use npm run setup for live seed)

USE credence_db;

-- Users (login via API — passwords: admin123, password123, operator123)
-- Hashes generated at runtime by setup script; SQL seed is for manual reference.

INSERT INTO accounts (account_name, balance, status) VALUES
  ('John Savings',          50000.00, 'ACTIVE'),
  ('Jane Checking',         25000.00, 'ACTIVE'),
  ('Corp Account',         100000.00, 'ACTIVE'),
  ('Tech Startup',          75000.00, 'ACTIVE'),
  ('Personal Wallet',       12000.00, 'ACTIVE'),
  ('Family Joint Account',  35000.00, 'ACTIVE'),
  ('Emergency Fund',         8000.00, 'ACTIVE'),
  ('Investment Pool',      200000.00, 'ACTIVE'),
  ('Suspended User',         5000.00, 'SUSPENDED'),
  ('Closed Account',            0.00, 'CLOSED');

INSERT INTO transactions (account_id, amount, transaction_type, status) VALUES
  (1, 10000.00, 'CREDIT', 'SUCCESS'),
  (1,  5000.00, 'DEBIT',  'SUCCESS'),
  (1,  2500.00, 'DEBIT',  'SUCCESS'),
  (1,  8000.00, 'DEBIT',  'FAILED'),
  (2, 15000.00, 'CREDIT', 'SUCCESS'),
  (2,  3000.00, 'DEBIT',  'SUCCESS'),
  (2,  2000.00, 'CREDIT', 'SUCCESS'),
  (2,  1200.00, 'DEBIT',  'SUCCESS'),
  (3, 50000.00, 'CREDIT', 'SUCCESS'),
  (3, 20000.00, 'DEBIT',  'SUCCESS'),
  (3, 15000.00, 'DEBIT',  'SUCCESS'),
  (4, 30000.00, 'CREDIT', 'SUCCESS'),
  (4, 10000.00, 'DEBIT',  'SUCCESS'),
  (4,  5000.00, 'CREDIT', 'SUCCESS'),
  (5,  8000.00, 'CREDIT', 'SUCCESS'),
  (5,  1500.00, 'DEBIT',  'SUCCESS'),
  (6, 20000.00, 'CREDIT', 'SUCCESS'),
  (6,  7500.00, 'DEBIT',  'SUCCESS'),
  (7,  3000.00, 'CREDIT', 'SUCCESS'),
  (7,   500.00, 'DEBIT',  'SUCCESS'),
  (8, 100000.00, 'CREDIT', 'SUCCESS'),
  (8,  40000.00, 'DEBIT',  'SUCCESS'),
  (8,  25000.00, 'DEBIT',  'SUCCESS'),
  (9,  2000.00, 'DEBIT',  'FAILED'),
  (10, 1000.00, 'CREDIT', 'SUCCESS');
