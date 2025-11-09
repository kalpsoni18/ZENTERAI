terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Configure in terraform.tfvars
    bucket         = "zenterai-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "zenterai-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# KMS Key for encryption
resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for S3 encryption - Zenterai"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Lambda Service"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "zenterai-s3-encryption"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "s3_encryption" {
  name          = "alias/zenterai-s3-encryption"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

# S3 Bucket
module "s3" {
  source = "./modules/s3"

  bucket_name     = var.s3_bucket_name
  kms_key_id      = aws_kms_key.s3_encryption.arn
  environment     = var.environment
  enable_versioning = true
  enable_lifecycle = true
}

# DynamoDB Tables
module "dynamodb" {
  source = "./modules/dynamodb"

  table_prefix = var.dynamodb_table_prefix
  environment  = var.environment
  kms_key_id   = aws_kms_key.s3_encryption.arn
}

# Cognito
module "cognito" {
  source = "./modules/cognito"

  user_pool_name      = "zenterai-${var.environment}"
  identity_pool_name  = "zenterai-${var.environment}"
  environment         = var.environment
  callback_urls       = var.cognito_callback_urls
  logout_urls         = var.cognito_logout_urls
}

# Lambda Functions
module "lambda" {
  source = "./modules/lambda"

  environment           = var.environment
  cognito_user_pool_id  = module.cognito.user_pool_id
  s3_bucket_name        = module.s3.bucket_name
  s3_bucket_arn         = module.s3.bucket_arn
  kms_key_id            = aws_kms_key.s3_encryption.arn
  dynamodb_table_prefix = var.dynamodb_table_prefix
  stripe_secret_key     = var.stripe_secret_key
  api_gateway_id        = aws_apigatewayv2_api.main.id
  api_gateway_execution_arn = aws_apigatewayv2_api.main.execution_arn
  aws_region            = var.aws_region
}

# API Gateway
resource "aws_apigatewayv2_api" "main" {
  name          = "zenterai-${var.environment}"
  protocol_type = "HTTP"
  description   = "Zenterai API Gateway"

  cors_configuration {
    allow_origins = var.cors_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    allow_headers = ["*"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/zenterai-${var.environment}"
  retention_in_days  = 30
}

# CloudFront (optional)
module "cloudfront" {
  source = "./modules/cloudfront"
  count  = var.enable_cloudfront ? 1 : 0

  environment     = var.environment
  api_gateway_url = aws_apigatewayv2_api.main.api_endpoint
}

# Outputs
output "api_endpoint" {
  value = aws_apigatewayv2_api.main.api_endpoint
}

output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}

output "cognito_client_id" {
  value = module.cognito.client_id
}

output "s3_bucket_name" {
  value = module.s3.bucket_name
}

output "kms_key_id" {
  value = aws_kms_key.s3_encryption.key_id
}

