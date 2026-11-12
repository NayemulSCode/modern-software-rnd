import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Same flags as the other UI library studies, so bundle sizes are comparable.
  cacheComponents: true,
  partialPrefetching: true,
  // The default corner (bottom left) covers the colour-mode switch in the
  // sidebar footer during development.
  devIndicators: { position: "top-right" },
}

export default nextConfig
