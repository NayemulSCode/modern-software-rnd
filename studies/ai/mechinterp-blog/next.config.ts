import createMDX from "@next/mdx"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Same flags as the other studies in this repository.
  cacheComponents: true,
  partialPrefetching: true,
  // MDX files are imported by the post route, not used as pages.
  pageExtensions: ["ts", "tsx"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

// Turbopack runs the MDX compiler in Rust, so plugins are named as strings and
// their options must be plain JSON. A plugin that needs a function option
// cannot be used here.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm", "remark-math"],
    rehypePlugins: [
      "rehype-slug",
      ["rehype-katex", { strict: false, output: "htmlAndMathml" }],
      [
        "rehype-pretty-code",
        {
          // The default github themes fail WCAG contrast for comments on this
          // background; the high-contrast variants pass.
          theme: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" },
          keepBackground: false,
          defaultLang: "plaintext",
        },
      ],
    ],
  },
})

export default withMDX(nextConfig)
