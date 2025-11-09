# Deployment Guide

## Pre-Deployment Checklist

- [ ] AWS account configured with appropriate permissions
- [ ] Stripe account created and API keys obtained
- [ ] Domain name configured (if using custom domain)
- [ ] Terraform state backend configured (S3 bucket + DynamoDB table)
- [ ] Environment variables configured

## Step-by-Step Deployment

### 1. Infrastructure Setup

```bash
# Create Terraform state backend
aws s3 mb s3://zenterai-terraform-state
aws dynamodb create-table \
  --table-name zenterai-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Initialize Terraform
cd infra
terraform init

# Create and select workspace
terraform workspace new dev
terraform workspace select dev

# Configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars

# Plan and apply
terraform plan -var-file=envs/dev/terraform.tfvars
terraform apply -var-file=envs/dev/terraform.tfvars
```

### 2. Stripe Configuration

1. Create products in Stripe Dashboard:
   - **Starter**: $29/month, 5 users, 200GB
   - **Business**: $99/month, 50 users, 2TB
   - **Enterprise**: Custom pricing

2. Create webhook endpoint:
   - URL: `https://your-api.com/webhooks/stripe`
   - Events: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`

3. Get webhook secret and add to environment variables

### 3. Cognito SSO Setup

1. In AWS Cognito Console, go to your User Pool
2. Navigate to "Sign-in experience" > "Federated identity provider sign-in"
3. Add SAML identity provider:
   - Upload SAML metadata XML
   - Configure attribute mapping
4. Add OIDC provider (if needed):
   - Client ID and secret
   - Authorization and token endpoints

### 4. Deploy Lambda Functions

```bash
cd api
npm install
npm run build

# Package Lambda
zip -r function.zip dist/ node_modules/

# Deploy via Terraform (functions are managed in terraform)
terraform apply
```

### 5. Deploy Frontend

```bash
cd web
npm install
npm run build

# Deploy to S3/CloudFront
aws s3 sync dist/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### 6. Post-Deployment

1. **Create First Org**:
   - Use signup endpoint or admin console
   - First user becomes Owner

2. **Seed Super Admin** (optional):
   - Create super-admin user in DynamoDB
   - Grant special permissions

3. **Configure Monitoring**:
   - Set up CloudWatch alarms
   - Configure SNS for alerts

4. **Test SSO**:
   - Invite user with domain matching org domain
   - Test SAML/OIDC flow

## Environment Variables

See `.env.example` for all required variables.

## Monitoring

- CloudWatch Logs: Lambda functions, API Gateway
- CloudWatch Metrics: Lambda invocations, DynamoDB read/write
- S3 Access Logs: Bucket access patterns
- Audit Logs: DynamoDB audit table

## Troubleshooting

### Lambda Timeout
- Increase timeout in Terraform
- Check DynamoDB throttling

### S3 Access Denied
- Verify IAM policies
- Check KMS key permissions

### Cognito Auth Issues
- Verify user pool configuration
- Check callback URLs

## Scaling Considerations

- **DynamoDB**: Switch to provisioned capacity for predictable workloads
- **S3**: Enable Transfer Acceleration for global users
- **Lambda**: Use provisioned concurrency for critical functions
- **Multi-region**: Implement DynamoDB Global Tables + S3 Cross-Region Replication

