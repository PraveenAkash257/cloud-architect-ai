import { describe, it, expect } from "vitest";
import { generateTerraform } from "../terraformGenerator";

describe("terraformGenerator", () => {
  it("generates dynamic AMI, sensitive db password, and security group bindings", () => {
    const architecture = {
      entryPoint: "alb_1",
      nodes: [
        { id: "alb_1", type: "loadbalancer", label: "ALB Ingress", az: "ap-south-1a" },
        { id: "ec2_1", type: "vm", label: "EC2 Web App", az: "ap-south-1a" },
        { id: "db_1", type: "database", label: "PostgreSQL DB", az: "ap-south-1b" },
      ],
      edges: [
        { source: "alb_1", target: "ec2_1" },
        { source: "ec2_1", target: "db_1" },
      ],
    };

    const tf = generateTerraform(architecture, "ap-south-1");

    // 1. Dynamic AMI lookup
    expect(tf).toContain('data "aws_ami" "ubuntu"');
    expect(tf).toContain("data.aws_ami.ubuntu.id");

    // 2. Sensitive database password variable
    expect(tf).toContain('variable "db_password"');
    expect(tf).toContain("sensitive   = true");
    expect(tf).toContain("password               = var.db_password");

    // 3. EC2 attached to Security Group
    expect(tf).toContain("vpc_security_group_ids      = [aws_security_group.app_sg.id]");

    // 4. RDS attached to Security Group & Subnet Group
    expect(tf).toContain("vpc_security_group_ids = [aws_security_group.db_sg.id]");
    expect(tf).toContain("db_subnet_group_name   = aws_db_subnet_group.main.name");

    // 5. ALB -> EC2 Target Attachment
    expect(tf).toContain('resource "aws_lb_target_group_attachment"');

    // 6. AZ selection respected
    expect(tf).toContain('availability_zone           = "ap-south-1a"');
    expect(tf).toContain('availability_zone      = "ap-south-1b"');

    // 7. Dedicated VPC & subnets
    expect(tf).toContain('resource "aws_vpc" "main"');
    expect(tf).toContain('resource "aws_subnet" "public_1"');
    expect(tf).toContain('resource "aws_subnet" "private_1"');

    // 8. Least privilege security rules (RDS only accessible by app_sg)
    expect(tf).toContain("security_groups = [aws_security_group.app_sg.id]");
  });

  it("handles API Gateway -> Lambda integrations seamlessly", () => {
    const architecture = {
      entryPoint: "api_1",
      nodes: [
        { id: "api_1", type: "apigateway", label: "API Gateway" },
        { id: "lambda_1", type: "serverless", label: "Order Service" },
      ],
      edges: [{ source: "api_1", target: "lambda_1" }],
    };

    const tf = generateTerraform(architecture, "ap-southeast-1");

    expect(tf).toContain('resource "aws_apigatewayv2_integration"');
    expect(tf).toContain('resource "aws_lambda_permission"');
    expect(tf).toContain('resource "aws_apigatewayv2_route"');
  });

  it("handles empty architecture gracefully", () => {
    const tf = generateTerraform({ nodes: [], edges: [] }, "ap-southeast-1");
    expect(tf).toContain('region = "ap-southeast-1"');
    expect(tf).toContain("No components found");
  });
});
