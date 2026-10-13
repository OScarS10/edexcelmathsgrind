import type { MetadataRoute } from "next";

const BASE = "https://edexcelmathsgrind.vercel.app";

const PATHS = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/practice", priority: 0.8, changeFrequency: "weekly" },
  { path: "/search", priority: 0.8, changeFrequency: "weekly" },
  { path: "/skills", priority: 0.7, changeFrequency: "weekly" },
  { path: "/progress", priority: 0.7, changeFrequency: "weekly" },
  { path: "/resources", priority: 0.6, changeFrequency: "monthly" },
  { path: "/tmua", priority: 0.8, changeFrequency: "weekly" },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}