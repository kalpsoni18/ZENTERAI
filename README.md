# Zenterai

Enterprise-grade, serverless file storage and collaboration platform with multi-tenant isolation, RBAC, SSO, and Apple-inspired UI.

## Features

- **Multi-tenant Isolation**: Per-org S3 prefix or dedicated bucket
- **RBAC**: Owner, Admin, Manager, Member, Guest roles with hierarchical permissions
- **SSO**: Amazon Cognito with SAML/OIDC support
- **Billing**: Stripe integration with subscription tiers and metered overage
- **Audit Logging**: Immutable audit logs in DynamoDB + S3
- **Encryption**: SSE-KMS + optional client-side zero-knowledge encryption
- **Compliance**: 7-year audit retention, access logging, versioning

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js Lambda functions
- **Storage**: S3 with KMS encryption
- **Database**: DynamoDB (on-demand)
- **Auth**: Amazon Cognito
- **Infrastructure**: Terraform
- **CI/CD**: GitHub Actions

## Quick Start

### 🚀 Local Testing (No AWS Required!)

**One-click test run:**
```bash
./scripts/test-local.sh
```

**One-click cleanup:**
```bash
./scripts/stop-local.sh
```

See [QUICK-START.md](./QUICK-START.md) for details.

### Production Deployment

### Prerequisites

- Node.js 18+
- Terraform 1.5+
- AWS CLI configured
- Stripe account

### 1. Clone and Install

```bash
git clone <repo-url>
cd zenterai

# Install dependencies
cd web && npm install
cd ../api && npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Deploy Infrastructure

```bash
cd infra

# Initialize Terraform
terraform init

# Create workspace
terraform workspace new dev
terraform workspace select dev

# Review plan
terraform plan -var-file=envs/dev/terraform.tfvars

# Deploy
terraform apply -var-file=envs/dev/terraform.tfvars
```

### 4. Build and Deploy Lambda Functions

```bash
cd api
npm run build
# Package and deploy via Terraform or SAM
```

### 5. Build Frontend

```bash
cd web
npm run build
# Deploy to S3/CloudFront or your hosting
```

## RBAC Permissions Matrix

| Role   | Org Settings | Users | Billing | Files | Shares | Audit |
|--------|--------------|-------|---------|-------|--------|-------|
| Owner  | Full         | Full  | Full    | Full  | Full   | Full  |
| Admin  | Read/Update  | Full  | Full    | Full  | Full   | Read  |
| Manager| -            | Read  | -       | Full  | Full   | -     |
| Member | -            | -     | -       | CRUD  | Create | -     |
| Guest  | -            | -     | -       | Read  | Read   | -     |

## Cost Estimate (5 users, 100GB)

- **DynamoDB**: ~$5/month (on-demand)
- **S3 Storage**: ~$2.30/month (100GB)
- **Lambda**: ~$1/month (1M requests)
- **API Gateway**: ~$3.50/month (1M requests)
- **CloudFront**: ~$1/month (optional)
- **Cognito**: Free tier
- **KMS**: ~$1/month

**Total**: ~$13-15/month for small org

## Security

- Per-org S3 isolation with IAM policies
- KMS encryption at rest
- Optional client-side encryption (zero-knowledge)
- Immutable audit logs
- SSO with SAML/OIDC
- Domain verification for auto-provisioning

## License

Proprietary - All rights reserved

# ZENTERAI
# ZENTERAI
