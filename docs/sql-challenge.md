# Part B – SQL Challenge

## Assumptions

- Only `SUCCESS` transactions count toward credit/debit totals.
- Amounts are in a single currency (INR/USD — no conversion).
- Timestamps are stored in UTC.
- `FAILED` transactions are retained for audit purposes.

---

## Query 1: Top 5 accounts by total debit volume (last 30 days)

```sql
SELECT
  a.account_id,
  a.account_name,
  SUM(t.amount) AS total_debit
FROM accounts a
INNER JOIN transactions t ON t.account_id = a.account_id
WHERE t.transaction_type = 'DEBIT'
  AND t.status = 'SUCCESS'
  AND t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY a.account_id, a.account_name
ORDER BY total_debit DESC
LIMIT 5;
```

---

## Query 2: Daily transaction volume report

```sql
SELECT
  DATE(t.created_at) AS txn_date,
  COUNT(*) AS transaction_count,
  SUM(CASE WHEN t.transaction_type = 'CREDIT' THEN t.amount ELSE 0 END) AS total_credit,
  SUM(CASE WHEN t.transaction_type = 'DEBIT' THEN t.amount ELSE 0 END) AS total_debit
FROM transactions t
WHERE t.status = 'SUCCESS'
GROUP BY DATE(t.created_at)
ORDER BY txn_date DESC;
```

---

## Query 3: Accounts with no transactions in 90 days

```sql
SELECT
  a.account_id,
  a.account_name,
  a.balance,
  MAX(t.created_at) AS last_transaction_at
FROM accounts a
LEFT JOIN transactions t
  ON t.account_id = a.account_id AND t.status = 'SUCCESS'
GROUP BY a.account_id, a.account_name, a.balance
HAVING last_transaction_at IS NULL
    OR last_transaction_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

---

## Query 4: Failed transaction rate per account

```sql
SELECT
  a.account_id,
  a.account_name,
  COUNT(*) AS total_transactions,
  SUM(CASE WHEN t.status = 'FAILED' THEN 1 ELSE 0 END) AS failed_count,
  ROUND(
    SUM(CASE WHEN t.status = 'FAILED' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    2
  ) AS failure_rate_pct
FROM accounts a
INNER JOIN transactions t ON t.account_id = a.account_id
GROUP BY a.account_id, a.account_name
ORDER BY failure_rate_pct DESC;
```

---

## Query 5: Running balance per account (window function)

```sql
SELECT
  t.account_id,
  t.transaction_id,
  t.transaction_type,
  t.amount,
  t.created_at,
  SUM(
    CASE
      WHEN t.transaction_type = 'CREDIT' THEN t.amount
      ELSE -t.amount
    END
  ) OVER (
    PARTITION BY t.account_id
    ORDER BY t.created_at, t.transaction_id
    ROWS UNBOUNDED PRECEDING
  ) AS running_balance
FROM transactions t
WHERE t.status = 'SUCCESS'
ORDER BY t.account_id, t.created_at;
```

---

## Index Recommendations

```sql
CREATE INDEX idx_transactions_account_created
  ON transactions (account_id, created_at DESC);

CREATE INDEX idx_transactions_status_type
  ON transactions (status, transaction_type);

CREATE INDEX idx_accounts_status ON accounts (status);
```

### Why these indexes help

| Index | Benefit |
|-------|---------|
| `(account_id, created_at DESC)` | Covers listing API, date-range filters, and account summary joins |
| `(status, transaction_type)` | Speeds up filtered listing and analytics queries |
| `(status)` on accounts | Fast lookup of active accounts |

---

## Query Optimization Notes

1. **Use `EXPLAIN ANALYZE`** on listing queries before and after adding indexes to measure row scans vs index seeks.
2. **Avoid `SELECT *`** in production — fetch only required columns.
3. **Pagination**: use `LIMIT/OFFSET` for small pages; for deep pagination consider keyset pagination on `(created_at, transaction_id)`.
4. **Partitioning**: partition `transactions` by month when the table exceeds ~10M rows.
5. **Covering index**: `(account_id, status, transaction_type, amount, created_at)` can satisfy summary queries without table lookups.
