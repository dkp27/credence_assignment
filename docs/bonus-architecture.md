# Bonus Architecture — Queue & Event Bus

## Overview

Implements the assignment bonus flow:

```
Transaction API  →  Queue (RabbitMQ)  →  Worker  →  Event Bus  →  Consumer Services
```

## Components

| Component | File | Description |
|-----------|------|-------------|
| **Transaction API** | `POST /api/v1/transactions/async` | Validates & enqueues job |
| **Queue** | `transaction.jobs` | RabbitMQ durable queue |
| **Worker** | `src/workers/transactionWorker.ts` | Processes DB transaction |
| **Event Bus** | `credence.events` (topic exchange) | Publishes completion events |
| **Notification Consumer** | `src/consumers/notificationConsumer.ts` | Simulates customer alerts |
| **Analytics Consumer** | `src/consumers/analyticsConsumer.ts` | Simulates metrics pipeline |
| **Audit Consumer** | `src/consumers/auditConsumer.ts` | Simulates audit logging |

## How to Run

### Terminal 1 — API

```bash
npm run dev
```

### Terminal 2 — RabbitMQ

```bash
npm run docker:infra    # MySQL + RabbitMQ
```

RabbitMQ Management UI: http://localhost:15672 (guest / guest)

### Terminal 3 — Worker + Consumers

```bash
npm run worker
```

### Test async transaction

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@credence.com","password":"admin123"}' \
  | jq -r '.data.token')

# 2. Enqueue transaction
curl -X POST http://localhost:3000/api/v1/transactions/async \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accountId":101,"amount":1000,"transactionType":"CREDIT"}'
```

**Response (202):**

```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "status": "QUEUED",
    "message": "Transaction queued for processing",
    "enqueuedAt": "2026-06-15T..."
  }
}
```

Worker logs show processing + event bus publish. Consumers log notification/analytics/audit messages.

## Sync vs Async

| Endpoint | Mode | Response |
|----------|------|----------|
| `POST /api/v1/transactions` | Sync | `201` — immediate result |
| `POST /api/v1/transactions/async` | Async | `202` — queued via RabbitMQ |

## Environment Variables

```env
RABBITMQ_URL=amqp://guest:guest@127.0.0.1:5672
USE_QUEUE=true
```

Set `USE_QUEUE=false` to disable async endpoint.

## Why RabbitMQ (not Kafka)

Both satisfy the assignment. RabbitMQ is lighter for local development and Docker setup. The same event-driven pattern applies to Kafka with topics instead of exchanges.

## Postman Collection

Import from `postman/`:

- `Credence_Transaction_API.postman_collection.json`
- `Credence_Local.postman_environment.json`

Run **Auth → Login** first — token is saved automatically.
