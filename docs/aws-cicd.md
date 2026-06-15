# AWS CI/CD Pipeline — GitHub Actions

## Pipeline Overview

```
GitHub Push/PR
      |
      v
+------------------+       +---------------------------+
|  CI Workflow     |       |  CD Workflow (main only)  |
|  ci.yml          |       |  cd.yml                   |
+------------------+       +---------------------------+
| - npm ci         |       | - Build Docker image      |
| - TypeScript     |       | - Push to Amazon ECR      |
| - Jest tests     |       | - Update ECS task def     |
| - npm build      |       | - Deploy to ECS Fargate   |
| - Docker build   |       | - Wait for stability      |
+------------------+       +---------------------------+
```

## Architecture on AWS

```
Internet
    |
    v
Application Load Balancer (ALB)
    |
    v
ECS Fargate Service (credence-api)
    |
    +----> Amazon RDS (MySQL)
    |
    +----> Amazon MQ / RabbitMQ (optional, for async)
    |
    v
CloudWatch Logs
```

---

## Files Added

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | CI on push/PR — lint, test, build, docker check |
| `.github/workflows/cd.yml` | CD on push to `main` — ECR push + ECS deploy |
| `Dockerfile` | Production API container image |
| `Dockerfile.worker` | RabbitMQ worker container image |
| `deploy/ecs-task-definition.json` | ECS Fargate task definition (API) |
| `deploy/ecs-worker-task-definition.json` | ECS task definition (worker) |

---

## Step 1 — AWS Prerequisites

### 1.1 Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name credence-api \
  --region ap-south-1 \
  --image-scanning-configuration scanOnPush=true
```

### 1.2 Create RDS MySQL (or use existing)

- Engine: MySQL 8.0
- Database name: `credence_db`
- Note: host, port, username, password

### 1.3 Store secrets in AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name credence/db \
  --secret-string '{
    "host":"your-rds-endpoint.rds.amazonaws.com",
    "port":"3306",
    "name":"credence_db",
    "user":"admin",
    "password":"your-secure-password"
  }'

aws secretsmanager create-secret \
  --name credence/jwt \
  --secret-string '{"secret":"your-production-jwt-secret"}'
```

### 1.4 Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name credence-cluster \
  --region ap-south-1
```

### 1.5 Create CloudWatch Log Groups

```bash
aws logs create-log-group --log-group-name /ecs/credence-transaction-service
aws logs create-log-group --log-group-name /ecs/credence-transaction-worker
```

### 1.6 Update task definition

Edit `deploy/ecs-task-definition.json`:
- Replace `YOUR_ACCOUNT_ID`
- Replace `YOUR_REGION`
- Update Secrets Manager ARNs

### 1.7 Register task definition & create ECS service

```bash
aws ecs register-task-definition \
  --cli-input-json file://deploy/ecs-task-definition.json

# Create service with ALB (requires VPC, subnets, security groups)
aws ecs create-service \
  --cluster credence-cluster \
  --service-name credence-api-service \
  --task-definition credence-transaction-service \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

---

## Step 2 — GitHub Secrets

Go to: **GitHub Repo → Settings → Secrets and variables → Actions**

| Secret | Example | Description |
|--------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | `AKIA...` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | `...` | IAM secret key |
| `AWS_REGION` | `ap-south-1` | AWS region |
| `ECR_REPOSITORY` | `credence-api` | ECR repo name |
| `ECS_CLUSTER` | `credence-cluster` | ECS cluster name |
| `ECS_SERVICE` | `credence-api-service` | ECS service name |

### IAM Policy for CI/CD user

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:DescribeTasks",
        "ecs:ListTasks",
        "ecs:RegisterTaskDefinition",
        "ecs:UpdateService"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["iam:PassRole"],
      "Resource": "*"
    }
  ]
}
```

---

## Step 3 — GitHub Environments (Optional)

Create environment: **production**

Go to: Settings → Environments → New environment → `production`

Add protection rules:
- Required reviewers (optional)
- Deployment branch: `main` only

The CD workflow uses `environment: production`.

---

## Step 4 — How It Works

### CI (every push & PR)

1. Checkout code
2. `npm ci`
3. `npm run lint` (TypeScript check)
4. `npm test` (20 Jest tests, SQLite in-memory)
5. `npm run build`
6. Docker build verification (no push)

### CD (push to `main` only)

1. Configure AWS credentials
2. Login to ECR
3. Build Docker image tagged with commit SHA + `latest`
4. Push to ECR
5. Render new ECS task definition with updated image
6. Deploy to ECS service
7. Wait for service stability
8. Print deployment summary in GitHub Actions

---

## Step 5 — Manual Deploy Trigger

```bash
# From GitHub UI: Actions → CD — Deploy to AWS ECS → Run workflow
```

Or push to `main`:

```bash
git add .
git commit -m "feat: deploy to AWS"
git push origin main
```

---

## Step 6 — Verify Deployment

```bash
# Check ECS service
aws ecs describe-services \
  --cluster credence-cluster \
  --services credence-api-service

# Health check
curl https://your-alb-dns/api/v1/health
```

---

## Local Docker Test (before AWS)

```bash
# Build
docker build -t credence-api:local -f Dockerfile .

# Run (point to your MySQL)
docker run -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PASSWORD=your_password \
  -e JWT_SECRET=local-secret \
  credence-api:local

# Health check
curl http://localhost:3000/api/v1/health
```

---

## Recommended: OIDC instead of Access Keys

For production, use GitHub OIDC with IAM roles (no long-lived keys):

```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole
    aws-region: ap-south-1
```

See: https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| ECR login failed | Check AWS credentials secrets |
| ECS deploy timeout | Check security groups, RDS connectivity |
| Health check failing | Verify `/api/v1/health` and DB connection |
| Task keeps restarting | Check CloudWatch logs `/ecs/credence-transaction-service` |
| Tests fail in CI | Run `npm test` locally first |

---

## Interview Talking Points

1. **CI** catches bugs before merge — lint, test, build on every PR
2. **CD** automates deployment — no manual SSH to servers
3. **Docker** ensures same environment dev → staging → production
4. **ECS Fargate** — serverless containers, no EC2 management
5. **ECR** — private Docker registry in AWS
6. **Secrets Manager** — DB passwords never in code or GitHub
7. **Health checks** — ALB + ECS verify app is healthy before routing traffic
