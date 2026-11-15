// Kept free of server-only imports so proxy.ts can use it too.

/** The series in reading order. A post exists only if its slug is listed here. */
export const POST_SLUGS = [
  "what-is-mechanistic-interpretability",
  "features-and-superposition",
  "sparse-autoencoders",
  "induction-heads",
] as const

export type PostSlug = (typeof POST_SLUGS)[number]

export function isPostSlug(value: string): value is PostSlug {
  return (POST_SLUGS as readonly string[]).includes(value)
}
