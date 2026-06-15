# Credence Transaction Management Service

Node.js + TypeScript REST API for managing account transactions.  
Built for the **Credence Full Stack Developer (3 YOE) Technical Assessment**.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js + TypeScript | Runtime & type safety |
| Express | HTTP framework |
| MySQL | Production database |
| Sequelize ORM | Models, migrations, queries |
| Swagger UI | Interactive API documentation |
| JWT (jsonwebtoken) | API authentication |
| Bunyan | Structured JSON logging |
| Jest + Supertest | Integration tests |
| bcryptjs | Password hashing |

---

## Prerequisites

- **Node.js** 18+
- **MySQL** 8.0+ (or Docker — see below)

---

## Quick Start

### 1. Clone & configure

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```env
DB_HOST=127.0.0.1
DB_PASSWORD=your_mysql_password
JWT_SECRET=your_secret_key
```

### 2. One-command setup

```bash
npm run setup
```

This will:
1. Install npm packages
2. Connect to MySQL (create `credence_db` only if it doesn't exist)
3. Run migrations (create/update tables)
4. Seed sample data (users, 16 accounts, 373 transactions)

### 3. Start server

```bash
npm run dev
```

Server prints:

```
══════════════════════════════════════════════════
  Credence Transaction API — Server running
══════════════════════════════════════════════════

  API Base:     http://localhost:3000/api/v1
  Swagger UI:   http://localhost:3000/api-docs
  OpenAPI JSON: http://localhost:3000/api-docs.json
  Health:       http://localhost:3000/api/v1/health
  Login:        http://localhost:3000/api/v1/auth/login
```

### 4. Run tests

```bash
npm test
```

Tests use SQLite in-memory — no MySQL required.

---

## Docker MySQL (optional)

If you don't have MySQL installed locally:

```bash
npm run docker:db          # start MySQL container
# set DB_PASSWORD=rootpassword in .env
npm run setup
```

---

## Authentication

Transaction endpoints require a JWT Bearer token.

### Step 1 — Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@credence.com","password":"admin123"}'
```

### Step 2 — Use token

```bash
curl http://localhost:3000/api/v1/transactions \
  -H "Authorization: Bearer <your_token>"
```

In Swagger UI: click **Authorize** → enter `Bearer <token>`

### Seed users

| Email | Password | Role |
|-------|----------|------|
| admin@credence.com | admin123 | ADMIN |
| john@example.com | password123 | USER |
| jane@example.com | password123 | USER |
| operator@credence.com | operator123 | USER |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/login` | No | Login, get JWT |
| `POST` | `/api/v1/auth/register` | No | Register new user |
| `GET` | `/api/v1/auth/me` | Yes | Current user profile |
| `POST` | `/api/v1/transactions` | Yes | Create DEBIT/CREDIT transaction (sync) |
| `POST` | `/api/v1/transactions/async` | Yes | **Other** — Queue via RabbitMQ (202) |
| `GET` | `/api/v1/transactions` | Yes | List with pagination, filter, sort |
| `GET` | `/api/v1/accounts/:accountId/summary` | Yes | Account balance summary |
| `GET` | `/api/v1/health` | No | Health check |

---

## API Examples (Assignment Document)

Use **account ID 101** — seeded to match the assignment spec.

### Create Transaction

**Request** — `POST /api/v1/transactions`

```json
{
  "accountId": 101,
  "amount": 5000,
  "transactionType": "DEBIT"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "transactionId": 374,
    "status": "SUCCESS",
    "updatedBalance": 5000
  }
}
```

### Account Summary

**Request** — `GET /api/v1/accounts/101/summary`

**Response**

```json
{
  "success": true,
  "data": {
    "accountId": 101,
    "currentBalance": 10000,
    "totalCredit": 50000,
    "totalDebit": 40000,
    "transactionCount": 120
  }
}
```

### Transaction Listing

**Request** — `GET /api/v1/transactions?accountId=101&page=1&limit=20`

**Response**

```json
{
  "success": true,
  "data": [
    {
      "transactionId": 1,
      "accountId": 101,
      "amount": 833.33,
      "transactionType": "CREDIT",
      "status": "SUCCESS",
      "createdAt": "2026-06-15T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalRecords": 122,
    "totalPages": 7
  }
}
```

### Query Parameters (Listing)

| Param | Example | Description |
|-------|---------|-------------|
| `page` | `1` | Page number (default: 1) |
| `limit` | `20` | Records per page (max: 100) |
| `accountId` | `101` | Filter by account |
| `transactionType` | `DEBIT` | Filter DEBIT or CREDIT |
| `status` | `SUCCESS` | Filter by status |
| `sortBy` | `createdAt` | Sort field |
| `sortOrder` | `desc` | `asc` or `desc` |
| `fromDate` | `2026-01-01` | Date range start |
| `toDate` | `2026-12-31` | Date range end |

---

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Install packages + create DB + migrate + seed |
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run production build |
| `npm test` | Run Jest tests (20 tests) |
| `npm run db:setup` | DB setup only (no npm install) |
| `npm run db:test` | Test MySQL connection credentials |
| `npm run db:seed` | Seed data only |
| `npm run docker:db` | Start MySQL via Docker |
| `npm run docker:infra` | Start MySQL + RabbitMQ (Docker) |
| `npm run worker` | Start queue worker + event consumers |
| `npm run lint` | TypeScript type check |
| `docker build -t credence-api .` | Build production Docker image |

**Re-seed from scratch:**

```bash
SEED_FORCE=true npm run db:setup
```

---

## Queue & Event Bus (RabbitMQ)

```
Transaction API → Queue → Worker → Event Bus → Consumer Services
```

| Step | Command |
|------|---------|
| 1. Start infra | `npm run docker:infra` |
| 2. Start API | `npm run dev` |
| 3. Start worker | `npm run worker` |
| 4. Async API | `POST /api/v1/transactions/async` |

RabbitMQ UI: http://localhost:15672 (guest / guest)

Full details: [docs/architecture.md](docs/architecture.md)

---

## API Collection (Postman)

Import into Postman:

- `postman/Credence_Transaction_API.postman_collection.json`
- `postman/Credence_Local.postman_environment.json`

1. Select **Credence Local** environment
2. Run **Auth → Login** (saves JWT automatically)
3. Test all endpoints including async transaction

Swagger UI is also available: http://localhost:3000/api-docs

---

## Assignment Deliverables

```
credence/
├── src/              # TypeScript application source
├── database/         # SQL scripts (schema.sql, seed.sql)
├── docs/             # Assignment docs + folder structure guide
├── tests/            # Jest integration tests
├── docker-compose.yml
├── package.json
└── README.md
```

**Full folder structure with file descriptions:**  
See [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md)

---

## Architecture

```
Client → Express (app.ts)
           ├── middleware (auth, validation, logger, errors)
           ├── routes (auth, transactions)
           ├── controllers (HTTP handlers)
           ├── services (business logic + row locks)
           └── models (Sequelize → MySQL)
```

**Concurrency safety:** `transactionService.ts` uses `SELECT ... FOR UPDATE` inside a Sequelize transaction to prevent double-spend race conditions.

---

## CI/CD — GitHub Actions + AWS ECS

| Workflow | Trigger | Action |
|----------|---------|--------|
| `ci.yml` | Push / PR to main, develop | Lint → Test → Build → Docker check |
| `cd.yml` | Push to `main` | Build → ECR → Deploy ECS Fargate |

**Setup guide:** [docs/aws-cicd.md](docs/aws-cicd.md)

### GitHub Secrets (for CD)

| Secret | Example |
|--------|---------|
| `AWS_ACCESS_KEY_ID` | IAM key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret |
| `AWS_REGION` | `ap-south-1` |
| `ECR_REPOSITORY` | `credence-api` |
| `ECS_CLUSTER` | `credence-cluster` |
| `ECS_SERVICE` | `credence-api-service` |

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DB_HOST` | MySQL host (use 127.0.0.1) | `127.0.0.1` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Database name | `credence_db` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | `your_password` |
| `JWT_SECRET` | JWT signing key | `your_secret` |
| `JWT_EXPIRES_IN` | Token expiry | `24h` |
| `SEED_FORCE` | Re-seed even if data exists | `false` |
| `LOG_LEVEL` | Bunyan log level | `info` |

---