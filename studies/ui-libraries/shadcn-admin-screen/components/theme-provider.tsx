"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// The scaffold also registered a bare "d" key that toggles dark mode. It was
// removed: a single-character shortcut that cannot be turned off fails WCAG
// 2.1.4, and the sidebar already has a visible switch.
function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
