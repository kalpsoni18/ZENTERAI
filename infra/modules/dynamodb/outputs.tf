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

