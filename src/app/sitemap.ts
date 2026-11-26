import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { url: "/", priority: 1.0, changeFrequency: "daily" as const },
    { url: "/restaurants", priority: 0.9, changeFrequency: "weekly" as const },
    { url: "/activities", priority: 0.9, changeFrequency: "weekly" as const },
    { url: "/shows", priority: 0.8, changeFrequency: "weekly" as const },
    { url: "/suggestions", priority: 0.8, changeFrequency: "weekly" as const },
    { url: "/map", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/contacts", priority: 0.7, changeFrequency: "monthly" as const },
  ];

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.url}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
