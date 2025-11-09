environment = "prod"
aws_region  = "us-east-1"

s3_bucket_name        = "zenterai-prod-storage"
dynamodb_table_prefix = "zenterai-prod"

cognito_callback_urls = ["https://app.zenterai.com/auth/callback"]
cognito_logout_urls   = ["https://app.zenterai.com/auth/logout"]

cors_origins = ["https://app.zenterai.com"]

enable_cloudfront = true

stripe_secret_key = "sk_live_..."

