environment = "dev"
aws_region  = "us-east-1"

s3_bucket_name        = "zenterai-dev-storage"
dynamodb_table_prefix = "zenterai-dev"

cognito_callback_urls = ["http://localhost:3000/auth/callback"]
cognito_logout_urls   = ["http://localhost:3000/auth/logout"]

cors_origins = ["http://localhost:3000"]

enable_cloudfront = false

stripe_secret_key = "sk_test_..."

