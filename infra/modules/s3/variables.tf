variable "bucket_name" {
  description = "S3 bucket name"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "enable_versioning" {
  description = "Enable S3 versioning"
  type        = bool
  default     = true
}

variable "enable_lifecycle" {
  description = "Enable S3 lifecycle rules"
  type        = bool
  default     = true
}

