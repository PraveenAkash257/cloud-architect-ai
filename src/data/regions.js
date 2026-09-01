export const REGIONS = [
  { code: "ap-south-1", city: "Mumbai", country: "India", flag: "🇮🇳", latitude: 19.0760, longitude: 72.8777 },
  { code: "ap-south-2", city: "Hyderabad", country: "India", flag: "🇮🇳", latitude: 17.3850, longitude: 78.4867 },
  { code: "ap-southeast-1", city: "Singapore", country: "Singapore", flag: "🇸🇬", latitude: 1.3521, longitude: 103.8198 },
  { code: "ap-southeast-3", city: "Jakarta", country: "Indonesia", flag: "🇮🇩", latitude: -6.2088, longitude: 106.8456 },
  { code: "ap-east-1", city: "Hong Kong", country: "Hong Kong", flag: "🇭🇰", latitude: 22.3193, longitude: 114.1694 },
  { code: "ap-northeast-1", city: "Tokyo", country: "Japan", flag: "🇯🇵", latitude: 35.6762, longitude: 139.6503 },
  { code: "ap-northeast-3", city: "Osaka", country: "Japan", flag: "🇯🇵", latitude: 34.6937, longitude: 135.5023 },
  { code: "ap-northeast-2", city: "Seoul", country: "South Korea", flag: "🇰🇷", latitude: 37.5665, longitude: 126.9780 },
  { code: "ap-southeast-2", city: "Sydney", country: "Australia", flag: "🇦🇺", latitude: -33.8688, longitude: 151.2093 },
  { code: "ap-southeast-4", city: "Melbourne", country: "Australia", flag: "🇦🇺", latitude: -37.8136, longitude: 144.9631 },
];

export const AZ_SUFFIXES = ["a", "b", "c"];

export function azOptionsForRegion(region) {
  if (!region) return [];
  return AZ_SUFFIXES.map((suffix) => `${region}${suffix}`);
}

export function getRegionMeta(code) {
  return REGIONS.find((r) => r.code === code);
}

export const REGION_COLORS = {
  "ap-south-1": "#2f6fed",
  "ap-south-2": "#4f8ef7",
  "ap-southeast-1": "#0e9f6e",
  "ap-southeast-3": "#22c07a",
  "ap-east-1": "#f1642e",
  "ap-northeast-1": "#e0387a",
  "ap-northeast-3": "#f2679a",
  "ap-northeast-2": "#8a3ffc",
  "ap-southeast-2": "#ffb020",
  "ap-southeast-4": "#ffcf5c",
};