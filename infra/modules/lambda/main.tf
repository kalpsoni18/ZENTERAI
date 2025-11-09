# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name = "zenterai-lambda-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda execution policy
resource "aws_iam_role_policy" "lambda_execution" {
  name = "zenterai-lambda-execution-${var.environment}"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Lambda permissions for DynamoDB
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "zenterai-lambda-dynamodb-${var.environment}"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.dynamodb_table_prefix}-*",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.dynamodb_table_prefix}-*/index/*"
        ]
      }
    ]
  })
}

# Lambda permissions for S3
resource "aws_iam_role_policy" "lambda_s3" {
  name = "zenterai-lambda-s3-${var.environment}"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:CreateMultipartUpload",
          "s3:UploadPart",
          "s3:CompleteMultipartUpload",
          "s3:AbortMultipartUpload"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}/*"
        ]
      }
    ]
  })
}

# Lambda permissions for KMS
resource "aws_iam_role_policy" "lambda_kms" {
  name = "zenterai-lambda-kms-${var.environment}"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = var.kms_key_id
      }
    ]
  })
}

# Lambda permissions for Cognito
resource "aws_iam_role_policy" "lambda_cognito" {
  name = "zenterai-lambda-cognito-${var.environment}"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminSetUserPassword",
          "cognito-idp:AdminGetUser",
          "cognito-idp:InitiateAuth",
          "cognito-idp:DescribeUserPool"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda function for auth handlers
resource "aws_lambda_function" "auth" {
  filename         = "${path.module}/../../api/dist/auth.zip"
  function_name    = "zenterai-auth-${var.environment}"
  role            = aws_iam_role.lambda.arn
  handler         = "handlers.auth.index.handler"
  runtime         = "nodejs20.x"
  timeout         = 30
  memory_size     = 256

  environment {
    variables = {
      COGNITO_USER_POOL_ID = var.cognito_user_pool_id
      COGNITO_CLIENT_ID    = var.cognito_client_id
      DYNAMODB_TABLE_PREFIX = var.dynamodb_table_prefix
      KMS_KEY_ID           = var.kms_key_id
      AWS_REGION           = var.aws_region
    }
  }

  tags = {
    Name        = "zenterai-auth-${var.environment}"
    Environment = var.environment
  }
}

# API Gateway integration
resource "aws_apigatewayv2_integration" "lambda_auth" {
  api_id           = var.api_gateway_id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.auth.invoke_arn
}

resource "aws_lambda_permission" "api_gateway_auth" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_gateway_execution_arn}/*/*"
}

