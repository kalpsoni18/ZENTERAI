# Organizations table
resource "aws_dynamodb_table" "orgs" {
  name           = "${var.table_prefix}-orgs"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_id  = var.kms_key_id
  }

  tags = {
    Name        = "${var.table_prefix}-orgs"
    Environment = var.environment
  }
}

# Users table
resource "aws_dynamodb_table" "users" {
  name           = "${var.table_prefix}-users"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "orgId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  attribute {
    name = "cognitoUserId"
    type = "S"
  }

  global_secondary_index {
    name            = "orgId-index"
    hash_key        = "orgId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "orgId-email-index"
    hash_key        = "orgId"
    range_key       = "email"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "cognitoUserId-index"
    hash_key        = "cognitoUserId"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_id  = var.kms_key_id
  }

  tags = {
    Name        = "${var.table_prefix}-users"
    Environment = var.environment
  }
}

# Files table
resource "aws_dynamodb_table" "files" {
  name           = "${var.table_prefix}-files"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "orgId"
    type = "S"
  }

  attribute {
    name = "parentId"
    type = "S"
  }

  global_secondary_index {
    name            = "orgId-parentId-index"
    hash_key        = "orgId"
    range_key       = "parentId"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_id  = var.kms_key_id
  }

  tags = {
    Name        = "${var.table_prefix}-files"
    Environment = var.environment
  }
}

# Shares table
resource "aws_dynamodb_table" "shares" {
  name           = "${var.table_prefix}-shares"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "fileId"
    type = "S"
  }

  attribute {
    name = "orgId"
    type = "S"
  }

  global_secondary_index {
    name            = "fileId-index"
    hash_key        = "fileId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "orgId-index"
    hash_key        = "orgId"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_id  = var.kms_key_id
  }

  tags = {
    Name        = "${var.table_prefix}-shares"
    Environment = var.environment
  }
}

# Audit logs table
resource "aws_dynamodb_table" "audit" {
  name           = "${var.table_prefix}-audit"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "orgId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  global_secondary_index {
    name            = "orgId-timestamp-index"
    hash_key        = "orgId"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_id  = var.kms_key_id
  }

  tags = {
    Name        = "${var.table_prefix}-audit"
    Environment = var.environment
  }
}

output "orgs_table_name" {
  value = aws_dynamodb_table.orgs.name
}

output "users_table_name" {
  value = aws_dynamodb_table.users.name
}

output "files_table_name" {
  value = aws_dynamodb_table.files.name
}

output "shares_table_name" {
  value = aws_dynamodb_table.shares.name
}

output "audit_table_name" {
  value = aws_dynamodb_table.audit.name
}

