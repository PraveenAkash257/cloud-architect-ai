/**
 * Static region/AZ reference data for the architecture diagram's grouping
 * feature. Not tied to any live AWS account — purely for laying components
 * out into regions and availability zones on the canvas.
 */
export const REGIONS = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"];
export const AZ_SUFFIXES = ["a", "b", "c"];

export function azOptionsForRegion(region) {
  if (!region) return [];
  return AZ_SUFFIXES.map((suffix) => `${region}${suffix}`);
}

export const REGION_COLORS = {
  "us-east-1": "#2f6fed",
  "us-west-2": "#8a3ffc",
  "eu-west-1": "#f1642e",
  "ap-southeast-1": "#0e9f6e",
};
