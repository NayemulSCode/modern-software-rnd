import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { AppFrame } from "@/components/app-frame"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { BRAND_THEME_SCRIPT } from "@/lib/brand-theme"
import { cn } from "@/lib/utils"

const fontSans = Geist({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: {
    default: "Inventory · shadcn/ui study",
    template: "%s · shadcn/ui study",
  },
  description:
    "The shared inventory admin screen, built with shadcn/ui on Base UI.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "font-sans antialiased",
        fontSans.variable,
        fontMono.variable
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BRAND_THEME_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <TooltipProvider>
            <AppFrame>{children}</AppFrame>
          </TooltipProvider>
          <Toaster position="bottom-right" visibleToasts={3} />
        </ThemeProvider>
      </body>
    </html>
  )
}
