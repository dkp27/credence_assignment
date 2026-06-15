# Part D – AI Assisted Development Log

## Prompts Used

1. *"Build a Node.js Transaction Management Service with TypeScript, Express, MySQL, Sequelize, Swagger UI, Bunyan logger, and Jest tests following the Credence assignment."*
2. *"Implement create transaction API with row-level locking to prevent race conditions."*
3. *"Add pagination, filtering, and sorting to transaction listing API."*
4. *"Write Jest integration tests using supertest."*

---

## AI Generated Code

AI generated initial scaffolding for:

- Express app structure (`app.ts`, `server.ts`)
- Sequelize models for `Account` and `Transaction`
- Basic CRUD-style service methods
- Swagger JSDoc annotations
- Jest test boilerplate

---

## Manual Modifications Made

| Area | Change |
|------|--------|
| Concurrency | Added `LOCK.UPDATE` + Sequelize transaction with `committed` flag |
| Insufficient balance | Record `FAILED` transaction before returning 400 |
| Validation | Added `express-validator` rules + custom `AppError` classes |
| Logging | Bunyan structured logger with request duration middleware |
| Tests | SQLite in-memory DB for isolated Jest runs |
| Sort whitelist | Prevent SQL injection via `SORTABLE_FIELDS` map |
| Error handler | Centralized middleware with proper HTTP status codes |

---

## Issues Found in AI Output

1. **Missing row locks** — AI initially used read-then-write without `FOR UPDATE`.
2. **Rollback after commit** — catch block called `rollback()` even after successful commit on validation errors.
3. **Float arithmetic** — AI used JS floats; fixed with `Number()` on DECIMAL fields and DB-level DECIMAL type.
4. **No failed transaction audit** — AI returned 400 without recording failed attempt.
5. **Swagger path** — needed explicit `apis` glob pointing to route/controller files.

---

## Final Production-Ready Files

- `src/services/transactionService.ts` — core business logic
- `src/middleware/errorHandler.ts` — centralized error handling
- `src/middleware/requestLogger.ts` — Bunyan HTTP logging
- `tests/transaction.test.ts` — full API test coverage
