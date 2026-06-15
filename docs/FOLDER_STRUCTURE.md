# Folder Structure

Complete project layout for the **Credence Transaction Management Service**.

```
credence/
│
├── postman/                             # Postman API collection (assignment deliverable)
│   ├── Credence_Transaction_API.postman_collection.json
│   └── Credence_Local.postman_environment.json
│
├── src/                                 # Application source code (TypeScript)
│   ├── config/
│   │   ├── database.ts
│   │   ├── dbEnv.ts
│   │   ├── logger.ts
│   │   ├── rabbitmq.ts                  # RabbitMQ URL config
│   │   └── swagger.ts
│   ├── queue/                           # RabbitMQ queue & event bus (bonus)
│   │   ├── constants.ts
│   │   ├── rabbitmqClient.ts
│   │   ├── transactionQueue.ts
│   │   └── eventBus.ts
│   ├── workers/
│   │   └── transactionWorker.ts
│   ├── consumers/
│   │   ├── notificationConsumer.ts
│   │   ├── analyticsConsumer.ts
│   │   └── auditConsumer.ts
│   ├── worker.ts                        # npm run worker
│   ├── controllers/
│   │   ├── authController.ts            # Login, register, profile
│   │   └── transactionController.ts     # Transactions, account summary, health
│   │
│   ├── database/                        # Database setup & seeding scripts
│   │   ├── console.ts                   # Human-readable setup console output
│   │   ├── seedData.ts                  # Seed users, accounts, transactions (incl. account 101)
│   │   ├── seed.ts                      # Standalone seed runner
│   │   ├── setup.ts                     # Full setup: DB create, migrate, seed
│   │   ├── sync.ts                      # Sync Sequelize models to MySQL
│   │   └── testConnection.ts            # Test MySQL credentials (npm run db:test)
│   │
│   ├── middleware/                      # Express middleware
│   │   ├── auth.ts                      # JWT authentication (Bearer token)
│   │   ├── errorHandler.ts              # Global error & 404 handlers
│   │   ├── requestLogger.ts             # HTTP request logging (Bunyan)
│   │   └── validation.ts                # express-validator rules
│   │
│   ├── models/                          # Sequelize ORM models
│   │   ├── Account.ts                   # accounts table
│   │   ├── Transaction.ts               # transactions table
│   │   ├── User.ts                      # users table (JWT auth)
│   │   ├── dataTypes.ts                 # Dialect-aware column types
│   │   └── index.ts                     # Model exports & associations
│   │
│   ├── routes/                          # API route definitions
│   │   ├── authRoutes.ts                # /api/v1/auth/*
│   │   └── index.ts                     # /api/v1/* (transactions, accounts, health)
│   │
│   ├── services/                        # Business logic layer
│   │   ├── authService.ts               # Login, register, JWT signing
│   │   └── transactionService.ts        # Create txn, list, summary (row locks)
│   │
│   ├── types/                           # TypeScript interfaces
│   │   └── index.ts                     # Request/response types
│   │
│   ├── utils/                           # Shared utilities
│   │   └── errors.ts                    # AppError, NotFoundError, ValidationError, etc.
│   │
│   ├── app.ts                           # Express app factory + URL printer
│   └── server.ts                        # Entry point — starts HTTP server
│
├── database/                            # Raw SQL scripts (assignment deliverable)
│   ├── schema.sql                       # CREATE DATABASE, tables, indexes
│   └── seed.sql                         # Sample INSERT statements
│
├── docs/                                # Assignment documentation
│   ├── bonus-architecture.md            # Bonus — Queue, worker, RabbitMQ
│   ├── FOLDER_STRUCTURE.md              # This file
│   ├── sql-challenge.md                 # Part B — SQL queries & optimization
│   ├── debugging-challenge.md           # Part C — Race condition & rollback
│   ├── ai-development-log.md            # Part D — AI prompts & modifications
│   └── performance-design.md            # Part E — Indexing, caching, scaling
│
├── tests/                               # Jest integration tests
│   ├── helpers/
│   │   └── testApp.ts                   # Test app, DB setup, JWT token helper
│   ├── env.ts                           # Test environment variables
│   ├── setup.ts                         # Jest hooks (reserved)
│   ├── auth.test.ts                     # Auth API tests
│   └── transaction.test.ts              # Transaction API tests
│
├── docker-compose.yml                   # Local MySQL + RabbitMQ
├── deploy/                              # AWS ECS task definitions
│   ├── ecs-task-definition.json
│   └── ecs-worker-task-definition.json
├── .github/workflows/                   # CI/CD (GitHub Actions → AWS)
│   ├── ci.yml
│   └── cd.yml
├── Dockerfile                           # Production API image
├── Dockerfile.worker                    # Worker image
├── .env.example                         # Environment variables template
├── .gitignore
├── jest.config.js                       # Jest test configuration
├── package.json                         # Dependencies & npm scripts
├── package-lock.json
├── tsconfig.json                        # TypeScript compiler options
└── README.md                            # Project overview & quick start
```

---

## Layer Architecture

```
HTTP Request
     │
     ▼
┌─────────────┐
│   routes/   │  URL → controller mapping, auth middleware
└──────┬──────┘
       ▼
┌─────────────┐
│ controllers/│  Validate input, call service, send JSON response
└──────┬──────┘
       ▼
┌─────────────┐
│  services/  │  Business logic, DB transactions, row locks
└──────┬──────┘
       ▼
┌─────────────┐
│   models/   │  Sequelize ORM → MySQL tables
└─────────────┘
```

---

## Key Files Explained

| File | Purpose |
|------|---------|
| `src/server.ts` | Connects to MySQL, syncs models, starts Express on `PORT` |
| `src/app.ts` | Registers middleware, Swagger UI, routes, error handlers |
| `src/services/transactionService.ts` | Core logic — `FOR UPDATE` row lock prevents race conditions |
| `src/database/setup.ts` | One-command setup: create DB → migrate → seed |
| `src/database/seedData.ts` | Seeds account **101** (assignment demo) + 373 transactions |
| `src/middleware/auth.ts` | Protects transaction routes with JWT Bearer token |
| `database/schema.sql` | Manual DDL if not using Sequelize sync |
| `tests/transaction.test.ts` | 14 API tests (auth + transactions + summary) |

---

## Assignment Mapping

| Assignment Part | Location |
|-----------------|----------|
| Part A — Backend APIs | `src/controllers/`, `src/services/`, `src/routes/` |
| Part B — SQL Challenge | `docs/sql-challenge.md`, `database/schema.sql` |
| Part C — Debugging | `docs/debugging-challenge.md`, `transactionService.ts` |
| Part D — AI Development | `docs/ai-development-log.md` |
| Part E — Performance | `docs/performance-design.md` |
| DB Scripts | `database/` |
| Bonus — Queue & Event Bus | `docs/bonus-architecture.md`, `src/queue/`, `src/worker.ts` |
| API Collection | `postman/`, Swagger UI `/api-docs` |
| Interview Guide | `docs/INTERVIEW_GUIDE.docx` |

---

## Generated at Runtime (not in repo)

```
dist/           # Compiled JavaScript (npm run build)
node_modules/   # npm dependencies
coverage/       # Jest coverage reports
.env            # Local environment (never commit)
```
