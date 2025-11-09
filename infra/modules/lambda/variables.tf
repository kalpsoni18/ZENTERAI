variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito Client ID"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name"
  type        = string
}

variable "s3_bucket_arn" {
  description = "S3 bucket ARN"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID"
  type        = string
}

variable "dynamodb_table_prefix" {
  description = "DynamoDB table prefix"
  type        = string
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
}

variable "api_gateway_id" {
  description = "API Gateway ID"
  type        = string
}

variable "api_gateway_execution_arn" {
  description = "API Gateway execution ARN"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

