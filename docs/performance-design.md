# Part E – Performance & Design

## 1. Database Indexing Strategy

- **Primary lookups**: `accounts(account_id)` — PK index
- **Transaction listing**: composite `(account_id, created_at DESC)`
- **Filtered queries**: `(status, transaction_type)`
- **Active accounts**: index on `accounts(status)`

Monitor with MySQL slow query log and `EXPLAIN ANALYZE`.

---

## 2. Caching Approach

| Data | Strategy |
|------|----------|
| Account summary | Redis cache, TTL 60s, invalidate on new transaction |
| Transaction list | Short TTL (30s) or no cache (frequently changing) |
| Account balance (writes) | **Never cache** — always read from DB inside transaction |

```
POST /transactions → invalidate cache key `summary:{accountId}`
GET  /summary      → check Redis → miss → query DB → set cache
```

---

## 3. Idempotency Handling

```
Client                          Server
  |                               |
  |-- POST /transactions -------->|
  |   Idempotency-Key: uuid-123   |
  |                               |-- check idempotency_keys table
  |                               |-- if exists → return cached response
  |                               |-- else → process + store key + response
  |<-- 201 (same on replay) ------|
```

Table: `idempotency_keys(key VARCHAR(64) PK, response JSON, created_at)`

---

## 4. Queue / Worker Architecture

```
API Server → Redis/BullMQ Queue → Worker → MySQL → Event Bus
```

- API validates request and enqueues job → returns `202 Accepted`
- Worker processes transaction with same locking logic
- Publishes `transaction.completed` event for downstream services

---

## 5. Horizontal Scaling

| Component | Approach |
|-----------|----------|
| API servers | Stateless behind load balancer (Nginx/ALB) |
| Database | MySQL primary + read replicas for listing/summary |
| Connection pooling | Sequelize pool + PgBouncer equivalent (ProxySQL for MySQL) |
| Message queue | RabbitMQ or Kafka for async processing |
| Sessions | No server-side sessions — fully stateless REST |

---

## Bonus Architecture

```
Transaction API → Queue → Worker → Event Bus (Kafka/RabbitMQ) → Consumer Services
                                                      ├── Notification Service
                                                      ├── Analytics Service
                                                      └── Audit Service
```
