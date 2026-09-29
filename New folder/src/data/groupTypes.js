// Preset container types, matching AWS's official "Group Icons" used in
// architecture diagrams (AWS Cloud, VPC, Subnet, etc.). These are purely
// visual/organizational — they group nodes on the canvas but are not part
// of the failure-simulation graph.

export const GROUP_TYPES = [
  { type: "aws-cloud", label: "AWS Cloud", color: "#232323", defaultWidth: 700, defaultHeight: 500 },
  { type: "aws-account", label: "AWS Account", color: "#232323", defaultWidth: 500, defaultHeight: 380 },
  { type: "region", label: "Region", color: "#545b64", defaultWidth: 460, defaultHeight: 340 },
  { type: "vpc", label: "Virtual Private Cloud (VPC)", color: "#8C4FFF", defaultWidth: 420, defaultHeight: 300 },
  { type: "public-subnet", label: "Public Subnet", color: "#00A4A6", defaultWidth: 300, defaultHeight: 200 },
  { type: "private-subnet", label: "Private Subnet", color: "#4B612C", defaultWidth: 300, defaultHeight: 200 },
  { type: "security-group", label: "Security Group", color: "#DD344C", defaultWidth: 260, defaultHeight: 180 },
  { type: "auto-scaling-group", label: "Auto Scaling Group", color: "#ED7100", defaultWidth: 280, defaultHeight: 200 },
  { type: "generic-group", label: "Generic Group", color: "#232323", defaultWidth: 260, defaultHeight: 180 },
];

export function getGroupMeta(type) {
  return GROUP_TYPES.find((g) => g.type === type);
}
