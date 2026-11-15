import { type NextRequest, NextResponse } from "next/server"

import { isPostSlug } from "@/lib/post-slugs"

/**
 * Unknown post URLs get a real 404 status. With Cache Components the post
 * page streams, and once streaming starts a notFound() inside the page can
 * only send a 200 with a noindex tag. Checking here runs before the response
 * begins.
 */
export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2] ?? ""
  if (!isPostSlug(decodeURIComponent(slug))) {
    // Any path no route matches renders the not-found page with status 404.
    return NextResponse.rewrite(new URL("/not-a-post", request.url))
  }
  return NextResponse.next()
}

export const config = {
  // Post pages only; the image route below a post handles its own params.
  matcher: "/posts/:slug",
}
