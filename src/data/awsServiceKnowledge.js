/**
 * Compact AWS architectural facts, keyed by the app's own componentType
 * (see componentTypes.js). This is NOT documentation — it exists purely so
 * prompt builders and sanitizers can answer two questions cheaply, without
 * burning tokens on AWS docs or making an extra LLM call:
 *
 *   1. Does AZ placement even mean anything for this service? (scope)
 *   2. What are the handful of architectural risks worth mentioning?
 *
 * SCOPES:
 *   GLOBAL   - not tied to any single AWS region (e.g. CloudFront, Route 53)
 *   REGIONAL - regional service; AWS manages AZ placement internally
 *   MULTI_AZ - AZ placement is a real, user-configurable decision
 *              (e.g. RDS Single-AZ vs Multi-AZ, Auto Scaling Group AZs)
 *   AZ       - deployed into one specific AZ unless explicitly duplicated
 *   SUBNET   - scoped to a subnet (rarely used standalone here)
 *   INSTANCE - scoped to a single instance
 *
 * Keep this file small. Do not add prose, links, or AWS documentation here.
 */

export const AWS_SERVICE_KNOWLEDGE = {
  vm: {
    service: "EC2",
    scope: "AZ",
    risks: ["single-AZ deployment", "single instance failure", "public exposure if in a public subnet"],
  },
  serverless: {
    service: "Lambda",
    scope: "REGIONAL",
    risks: ["VPC networking dependency when VPC-connected", "concurrency limits", "downstream dependency failure"],
  },
  database: {
    service: "RDS",
    scope: "MULTI_AZ",
    risks: ["single-AZ deployment if Multi-AZ is not enabled", "backup/recovery configuration", "connection exhaustion"],
  },
  storage: {
    service: "S3",
    scope: "REGIONAL",
    risks: ["public access misconfiguration", "missing lifecycle policy", "missing versioning"],
  },
  loadbalancer: {
    service: "Elastic Load Balancing",
    scope: "REGIONAL",
    risks: ["modeled single ingress dependency if no alternate path exists", "target health-check misconfiguration"],
  },
  apigateway: {
    service: "API Gateway",
    scope: "REGIONAL",
    risks: ["throttling limits", "missing caching", "modeled single ingress dependency"],
  },
  cdn: {
    service: "CloudFront",
    scope: "GLOBAL",
    risks: ["origin dependency", "cache/invalidation misconfiguration"],
  },
  firewall: {
    service: "Security Group",
    scope: "REGIONAL",
    risks: ["overly permissive inbound rule", "missing least-privilege scoping"],
  },
  dynamodb: {
    service: "DynamoDB",
    scope: "REGIONAL",
    risks: ["throttling", "hot partition keys", "capacity mode misconfiguration"],
  },
  vpc: {
    service: "VPC",
    scope: "REGIONAL",
    risks: ["misconfigured subnet routing", "missing NAT for private subnets"],
  },
  sns: {
    service: "SNS",
    scope: "REGIONAL",
    risks: ["missing DLQ for failed deliveries", "subscription misconfiguration"],
  },
  sqs: {
    service: "SQS",
    scope: "REGIONAL",
    risks: ["missing DLQ", "consumer failure", "visibility timeout misconfiguration"],
  },
  cloudwatch: {
    service: "CloudWatch",
    scope: "REGIONAL",
    risks: ["missing alarms", "no anomaly detection", "log retention misconfiguration"],
  },
  route53: {
    service: "Route 53",
    scope: "GLOBAL",
    risks: ["missing health-check failover", "DNS TTL misconfiguration"],
  },
  autoscaling: {
    service: "Auto Scaling",
    scope: "MULTI_AZ",
    risks: ["single-AZ scaling group", "scaling policy thresholds", "cooldown misconfiguration"],
  },
  ecs: {
    service: "ECS",
    scope: "REGIONAL",
    risks: ["task placement across AZs", "container image failure", "service auto-scaling limits"],
  },
};

/** Scopes where AZ placement is never architecturally meaningful. */
export const AZ_AGNOSTIC_SCOPES = new Set(["GLOBAL", "REGIONAL"]);

export function getServiceKnowledge(componentType) {
  return AWS_SERVICE_KNOWLEDGE[componentType] || null;
}

/** Whether an AZ value on this component type is meaningful information. */
export function isAzMeaningful(componentType) {
  const knowledge = getServiceKnowledge(componentType);
  if (!knowledge) return true; // unknown type: don't assume, keep whatever is given
  return !AZ_AGNOSTIC_SCOPES.has(knowledge.scope);
}
