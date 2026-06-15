# Part C – Debugging Challenge

## Race Condition Identified

### Buggy implementation (no row lock)

```javascript
// BAD: Two concurrent DEBIT requests can both pass the balance check
const account = await Account.findByPk(accountId);
if (Number(account.balance) >= amount) {
  await account.update({ balance: Number(account.balance) - amount });
  await Transaction.create({ account_id: accountId, amount, transaction_type: 'DEBIT', status: 'SUCCESS' });
}
```

**Problem:** Thread A reads balance = 5000, Thread B reads balance = 5000. Both debit 4000. Both succeed. Final balance = 1000 instead of expected overdraft rejection or single success.

---

## Transaction Handling (Fixed)

Our fix in `src/services/transactionService.ts`:

```typescript
const dbTransaction = await sequelize.transaction();
const account = await Account.findByPk(accountId, {
  lock: SequelizeTransaction.LOCK.UPDATE,  // SELECT ... FOR UPDATE
  transaction: dbTransaction,
});
// validate → update balance → insert transaction
await dbTransaction.commit();
```

- **BEGIN** — starts atomic unit of work
- **SELECT FOR UPDATE** — locks the account row until commit/rollback
- **UPDATE + INSERT** — both happen inside the same transaction
- **COMMIT** — releases lock and persists changes

---

## Rollback Strategy

| Scenario | Action |
|----------|--------|
| Account not found | `ROLLBACK`, return 404 |
| Account suspended | `ROLLBACK`, return 403 |
| Insufficient balance | Record `FAILED` transaction, `COMMIT`, return 400 |
| DB error mid-transaction | `ROLLBACK`, return 500, log error |
| Success | `COMMIT`, return 201 |

We use a `committed` flag to avoid calling `ROLLBACK` after a successful `COMMIT`.

---

## Improved Implementation Suggestions

1. **Idempotency keys** — client sends `Idempotency-Key` header; server stores and replays same response.
2. **Optimistic locking** — add `version` column to `accounts`; reject stale updates.
3. **Deadlock retry** — retry up to 3 times with exponential backoff on deadlock errors.
4. **Integration tests** — fire concurrent requests with `Promise.all` and assert balance integrity.
5. **Event-driven processing** — enqueue transactions to a worker for high-throughput scenarios (see bonus architecture).
