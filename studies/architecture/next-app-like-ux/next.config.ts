import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lesson 01 + 02: every route gets a prerendered shell, and `'use cache'`
  // becomes available. With this on, reading uncached data outside a
  // <Suspense> boundary is a build error instead of a silent slow page.
  cacheComponents: true,

  // Lesson 03: visible <Link>s prefetch one reusable App Shell per route.
  // Requires cacheComponents.
  partialPrefetching: true,

  experimental: {
    // Lesson 06: failed navigations, prefetches and Server Actions wait and
    // retry instead of throwing. Experimental — not for production yet.
    useOffline: true,

    // Lesson 12: lets Playwright's instant() helper run against `next start`.
    // Only switched on for the test build, never for a real deployment.
    exposeTestingApiInProductionBuild: process.env.EXPOSE_TESTING_API === "1",
  },

  // Development only: keep the Next.js DevTools button off the track title
  // in the player bar. You need that button for the Navigation Inspector.
  devIndicators: { position: "bottom-right" },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
