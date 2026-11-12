"use client";

import { LinkProvider } from "@astryxdesign/core/Link";
import { defineTheme, Theme } from "@astryxdesign/core/theme";
import { ToastViewport } from "@astryxdesign/core/Toast";
import Link from "next/link";
import { createContext, type ReactNode, use, useMemo, useState } from "react";
import { defaultThemeSlug, themes } from "@/astryx-themes";

export type ColorMode = "system" | "light" | "dark";
export type ThemeChoice = "neutral" | "brand";

// Requirement 7 of the test screen: one custom brand theme that changes the
// accent colour and corner radius. It extends the installed theme, so every
// token it does not mention keeps the neutral value. Each colour is a
// [light, dark] pair.
const brandTheme = defineTheme({
  name: "roastery-brand",
  extends: themes[defaultThemeSlug],
  tokens: {
    "--color-accent": ["#B4421A", "#F2A97E"],
    "--radius-container": "4px",
  },
});

const THEMES = { neutral: themes[defaultThemeSlug], brand: brandTheme };

type AppearanceContextValue = {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  theme: ThemeChoice;
  setTheme: (theme: ThemeChoice) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function useAppearance(): AppearanceContextValue {
  const value = use(AppearanceContext);
  if (!value) throw new Error("useAppearance must be used inside <Providers>.");
  return value;
}

export function Providers({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>("system");
  const [theme, setTheme] = useState<ThemeChoice>("neutral");
  const appearance = useMemo(() => ({ mode, setMode, theme, setTheme }), [mode, theme]);

  return (
    <AppearanceContext value={appearance}>
      <Theme theme={THEMES[theme]} mode={mode}>
        {/* Astryx links render through this, so they use the Next.js router
            instead of full page loads. */}
        <LinkProvider component={Link}>
          {/* useToast() needs a viewport above it in the tree. */}
          <ToastViewport position="bottomEnd" maxVisible={3}>
            {children}
          </ToastViewport>
        </LinkProvider>
      </Theme>
    </AppearanceContext>
  );
}
