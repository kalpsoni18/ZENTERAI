variable "user_pool_name" {
  description = "Cognito User Pool name"
  type        = string
}

variable "identity_pool_name" {
  description = "Cognito Identity Pool name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "callback_urls" {
  description = "Cognito callback URLs"
  type        = list(string)
}

variable "logout_urls" {
  description = "Cognito logout URLs"
  type        = list(string)
}

