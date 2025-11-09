variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "s3_bucket_name" {
  description = "S3 bucket name for file storage"
  type        = string
}

variable "dynamodb_table_prefix" {
  description = "Prefix for DynamoDB table names"
  type        = string
  default     = "zenterai"
}

variable "cognito_callback_urls" {
  description = "Cognito callback URLs"
  type        = list(string)
}

variable "cognito_logout_urls" {
  description = "Cognito logout URLs"
  type        = list(string)
}

variable "cors_origins" {
  description = "CORS allowed origins"
  type        = list(string)
}

variable "enable_cloudfront" {
  description = "Enable CloudFront distribution"
  type        = bool
  default     = false
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
}

