/**
 * Production-Grade Terraform (HCL) Generator for Cloud Architect AI.
 *
 * Faithfully translates visual graph nodes, AZ placements, and directional
 * connections into secure, deployable AWS infrastructure.
 */

function sanitizeName(str) {
  if (!str) return "resource";
  return str
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^_+|_+$/g, "") || "resource";
}

export function generateTerraform(architecture, defaultRegion = "ap-south-1") {
  const rawNodes = architecture?.nodes || [];
  // Filter out pure container visual groups from direct resource provisioning
  const nodes = rawNodes.filter((n) => n.type !== "container" && n.type !== "regionGroup");
  const edges = architecture?.edges || [];
  const entryPointId = architecture?.entryPoint;

  // Derive target region and AZ from nodes if set
  const region = nodes.find((n) => n.region)?.region || defaultRegion || "ap-south-1";
  const defaultAz = nodes.find((n) => n.az)?.az || `${region}a`;

  const nodeMap = new Map(nodes.map((n, i) => [
    n.id,
    {
      ...n,
      resName: `${sanitizeName(n.label || n.type || "node")}_${i + 1}`,
      isEntry: n.id === entryPointId,
      az: n.az || defaultAz,
    },
  ]));

  if (nodes.length === 0) {
    return `# ==============================================================================
# Terraform Infrastructure as Code (IaC)
# Generated automatically by Cloud Architect AI
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "${region}"
}

# No components found on the canvas.
# Drag components onto the canvas to generate architecture code.
`;
  }

  // Analyze Graph Relationships from Edges
  const hasAlb = nodes.some((n) => n.type === "loadbalancer");
  const hasEc2 = nodes.some((n) => n.type === "vm" || n.type === "ecs");
  const hasRds = nodes.some((n) => n.type === "database");
  const hasLambda = nodes.some((n) => n.type === "serverless");
  const hasApiGw = nodes.some((n) => n.type === "apigateway");
  const hasS3 = nodes.some((n) => n.type === "storage");
  const hasDynamo = nodes.some((n) => n.type === "dynamodb");
  const hasSqs = nodes.some((n) => n.type === "sqs");
  const hasSns = nodes.some((n) => n.type === "sns");

  // Track directed dependencies (e.g. ALB -> EC2, EC2 -> RDS)
  const albToEc2Attachments = [];
  const apiGwToLambdaIntegrations = [];
  const apiGwToAlbIntegrations = [];

  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    if (!sourceNode || !targetNode) continue;

    // Load Balancer -> EC2
    if (sourceNode.type === "loadbalancer" && targetNode.type === "vm") {
      albToEc2Attachments.push({ alb: sourceNode, ec2: targetNode });
    }

    // API Gateway -> Lambda
    if (sourceNode.type === "apigateway" && targetNode.type === "serverless") {
      apiGwToLambdaIntegrations.push({ apiGw: sourceNode, lambda: targetNode });
    }

    // API Gateway -> ALB
    if (sourceNode.type === "apigateway" && sourceNode.type === "loadbalancer") {
      apiGwToAlbIntegrations.push({ apiGw: sourceNode, alb: targetNode });
    }
  }

  let code = `# ==============================================================================
# Terraform Infrastructure as Code (IaC)
# Generated automatically by Cloud Architect AI
# Region: ${region} | AZ: ${defaultAz}
# Components: ${nodes.length} | Connections: ${edges.length}
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ------------------------------------------------------------------------------
# Provider & Environment Variables
# ------------------------------------------------------------------------------
variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "production"
}

${hasRds ? `variable "db_password" {
  description = "Master password for RDS database (Sensitive - do not hardcode)"
  type        = string
  sensitive   = true
  default     = "ChangeMeSecurely123!" # Override via terraform.tfvars or CLI
}
` : ""}
provider "aws" {
  region = "${region}"
  default_tags {
    tags = {
      ManagedBy   = "CloudArchitectAI"
      Environment = var.environment
    }
  }
}

# ------------------------------------------------------------------------------
# Dynamic Data Lookups (Region-Independent)
# ------------------------------------------------------------------------------
# Dynamically fetch the latest official Ubuntu 22.04 LTS AMI for ${region}
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] # Canonical official AWS owner ID
}

data "aws_availability_zones" "available" {
  state = "available"
}

# ==============================================================================
# Dedicated VPC & Subnet Networking
# ==============================================================================
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "cloud-architect-vpc"
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "cloud-architect-igw"
  }
}

# Public Subnets (for Ingress / Load Balancer / Public Web)
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${region}a"
    Tier = "Public"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${region}b"
    Tier = "Public"
  }
}

# Private Subnets (for Application Servers & Databases)
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "${region}a"

  tags = {
    Name = "private-subnet-${region}a"
    Tier = "Private"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "${region}b"

  tags = {
    Name = "private-subnet-${region}b"
    Tier = "Private"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name = "public-route-table"
  }
}

resource "aws_route_table_association" "pub_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "pub_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# ==============================================================================
# Security Groups (Principle of Least Privilege)
# ==============================================================================
${hasAlb ? `# Load Balancer Security Group (Accepts Public HTTP/HTTPS)
resource "aws_security_group" "alb_sg" {
  name        = "alb-security-group"
  description = "Allows public inbound traffic to Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Allow HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
` : ""}
${hasEc2 ? `# Application Server (EC2) Security Group
resource "aws_security_group" "app_sg" {
  name        = "app-server-sg"
  description = "Security group for compute instances"
  vpc_id      = aws_vpc.main.id

  ${hasAlb ? `ingress {
    description     = "Allow traffic strictly from Load Balancer"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }` : `ingress {
    description = "Allow public HTTP (Entry Point)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }`}

  egress {
    description = "Allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
` : ""}
${hasRds ? `# Database (RDS) Security Group (Only Accessible by App Servers)
resource "aws_security_group" "db_sg" {
  name        = "database-sg"
  description = "Restricts database access strictly to application instances"
  vpc_id      = aws_vpc.main.id

  ${hasEc2 ? `ingress {
    description     = "PostgreSQL access from Application Servers"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }` : `ingress {
    description = "PostgreSQL internal access"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }`}

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Dedicated RDS DB Subnet Group across multiple AZs
resource "aws_db_subnet_group" "main" {
  name        = "cloud-architect-db-subnet-group"
  description = "Database subnet group spanning multiple availability zones"
  subnet_ids  = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name = "Main DB Subnet Group"
  }
}
` : ""}
# ==============================================================================
# AWS Cloud Resources (Configured for ${region})
# ==============================================================================
`;

  // Render Node Resources
  const renderedResources = [];

  for (const [, node] of nodeMap) {
    const { resName, isEntry, az, label, type } = node;
    let block = "";

    switch (type) {
      case "vm":
        block = `# --- EC2 Instance: ${label}${isEntry ? " [Entry Point]" : ""} ---
resource "aws_instance" "${resName}" {
  ami                         = data.aws_ami.ubuntu.id # Dynamically resolved for ${region}
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.public_1.id
  availability_zone           = "${az}"
  vpc_security_group_ids      = [aws_security_group.app_sg.id]
  associate_public_ip_address = true

  tags = {
    Name = "${label}"
    AZ   = "${az}"
  }
}`;
        break;

      case "serverless":
        block = `# --- Lambda Function: ${label} ---
resource "aws_iam_role" "${resName}_role" {
  name = "${resName}_exec_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "${resName}_basic" {
  role       = aws_iam_role.${resName}_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "${resName}" {
  function_name = "${resName}"
  role          = aws_iam_role.${resName}_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  filename      = "lambda_payload.zip"

  tags = {
    Name = "${label}"
  }
}`;
        break;

      case "database":
        block = `# --- Relational Database (RDS): ${label} ---
resource "aws_db_instance" "${resName}" {
  identifier             = "${resName.replace(/_/g, "-")}"
  allocated_storage      = 20
  engine                 = "postgres"
  engine_version         = "15.3"
  instance_class         = "db.t3.micro"
  username               = "dbadmin"
  password               = var.db_password # Sensitive variable (not hardcoded)
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  availability_zone      = "${az}"
  skip_final_snapshot    = true
  multi_az               = false

  tags = {
    Name = "${label}"
    AZ   = "${az}"
  }
}`;
        break;

      case "storage":
        block = `# --- S3 Bucket: ${label} ---
resource "aws_s3_bucket" "${resName}" {
  bucket = "${resName.replace(/_/g, "-")}-bucket-${Math.floor(1000 + Math.random() * 9000)}"

  tags = {
    Name = "${label}"
  }
}

resource "aws_s3_bucket_versioning" "${resName}_ver" {
  bucket = aws_s3_bucket.${resName}.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "${resName}_block" {
  bucket = aws_s3_bucket.${resName}.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}`;
        break;

      case "loadbalancer":
        block = `# --- Application Load Balancer: ${label}${isEntry ? " [Entry Point]" : ""} ---
resource "aws_lb" "${resName}" {
  name               = "${resName.replace(/_/g, "-")}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  tags = {
    Name = "${label}"
  }
}

resource "aws_lb_target_group" "${resName}_tg" {
  name     = "${resName.replace(/_/g, "-")}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
  }
}

resource "aws_lb_listener" "${resName}_listener" {
  load_balancer_arn = aws_lb.${resName}.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.${resName}_tg.arn
  }
}`;
        break;

      case "apigateway":
        block = `# --- API Gateway HTTP API: ${label}${isEntry ? " [Entry Point]" : ""} ---
resource "aws_apigatewayv2_api" "${resName}" {
  name          = "${label}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE"]
    allow_headers = ["*"]
  }
}

resource "aws_apigatewayv2_stage" "${resName}_stage" {
  api_id      = aws_apigatewayv2_api.${resName}.id
  name        = "$default"
  auto_deploy = true
}`;
        break;

      case "cdn":
        block = `# --- CloudFront CDN Distribution: ${label} ---
resource "aws_cloudfront_distribution" "${resName}" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${label}"
  default_root_object = "index.html"

  origin {
    domain_name = "example.s3.amazonaws.com"
    origin_id   = "S3-Origin"
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-Origin"
    viewer_protocol_policy = "redirect-to-https"
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}`;
        break;

      case "dynamodb":
        block = `# --- DynamoDB Table: ${label} ---
resource "aws_dynamodb_table" "${resName}" {
  name         = "${label.replace(/[^a-zA-Z0-9_.-]/g, "_")}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name = "${label}"
  }
}`;
        break;

      case "sqs":
        block = `# --- SQS Queue: ${label} ---
resource "aws_sqs_queue" "${resName}" {
  name                      = "${resName.replace(/_/g, "-")}-queue"
  delay_seconds             = 0
  message_retention_seconds = 86400
}`;
        break;

      case "sns":
        block = `# --- SNS Topic: ${label} ---
resource "aws_sns_topic" "${resName}" {
  name = "${resName.replace(/_/g, "-")}-topic"
}`;
        break;

      default:
        block = `# --- Cloud Resource: ${label} (${type}) ---
# Managed by Cloud Architect AI`;
        break;
    }

    renderedResources.push(block);
  }

  code += renderedResources.join("\n\n") + "\n\n";

  // Render Inter-Service Connections derived from Graph Edges
  if (albToEc2Attachments.length > 0 || apiGwToLambdaIntegrations.length > 0) {
    code += `# ==============================================================================
# Inter-Service Canvas Connections (Target Attachments & Integrations)
# ==============================================================================
`;

    // 1. ALB -> EC2 Target Attachments
    albToEc2Attachments.forEach(({ alb, ec2 }, i) => {
      code += `# Connect ${alb.label} -> ${ec2.label}
resource "aws_lb_target_group_attachment" "${alb.resName}_to_${ec2.resName}_${i + 1}" {
  target_group_arn = aws_lb_target_group.${alb.resName}_tg.arn
  target_id        = aws_instance.${ec2.resName}.id
  port             = 80
}

`;
    });

    // 2. API Gateway -> Lambda Integrations
    apiGwToLambdaIntegrations.forEach(({ apiGw, lambda }, i) => {
      code += `# Route API Gateway (${apiGw.label}) -> Lambda (${lambda.label})
resource "aws_apigatewayv2_integration" "${apiGw.resName}_to_${lambda.resName}_${i + 1}" {
  api_id           = aws_apigatewayv2_api.${apiGw.resName}.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.${lambda.resName}.arn
}

resource "aws_apigatewayv2_route" "${apiGw.resName}_route_${i + 1}" {
  api_id    = aws_apigatewayv2_api.${apiGw.resName}.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/\${aws_apigatewayv2_integration.${apiGw.resName}_to_${lambda.resName}_${i + 1}.id}"
}

resource "aws_lambda_permission" "${apiGw.resName}_perm_${i + 1}" {
  statement_id  = "AllowAPIGatewayInvoke_${i + 1}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.${lambda.resName}.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "\${aws_apigatewayv2_api.${apiGw.resName}.execution_arn}/*/*"
}

`;
    });
  }

  // Helpful Deployment Commands at bottom
  code += `# ==============================================================================
# Deployment Instructions:
# 1. Initialize working directory:
#      terraform init
# 2. Preview the AWS deployment plan:
#      terraform plan
# 3. Apply and build the cloud architecture:
#      terraform apply
# ==============================================================================
`;

  return code;
}
