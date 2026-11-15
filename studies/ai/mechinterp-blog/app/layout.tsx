import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Link from "next/link"

import "./globals.css"
import { ThemeToggle } from "@/components/theme-toggle"
import { SITE } from "@/lib/posts"
import { THEME_SCRIPT } from "@/lib/theme"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.description,
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
  openGraph: { siteName: SITE.name, type: "website", locale: "en_GB" },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={SITE.locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        {/* Applies the saved colour mode before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-svh flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-background focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
            <Link href="/" className="font-semibold tracking-tight">
              {SITE.name}
            </Link>
            <nav aria-label="Site" className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-muted hover:text-foreground">
                Series
              </Link>
              <a href="/feed.xml" className="text-muted hover:text-foreground">
                RSS
              </a>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-border py-8 text-center text-sm text-muted">
          <p className="mx-auto max-w-prose px-4">
            A study in the modern-software-rnd repository. The models here are
            toys built to teach the ideas; the research they follow is cited
            in each post.
          </p>
        </footer>
      </body>
    </html>
  )
}
