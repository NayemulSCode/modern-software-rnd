export const BRAND_THEMES = [
  { value: "neutral", label: "Neutral" },
  { value: "roastery", label: "Roastery brand" },
] as const

export type BrandTheme = (typeof BRAND_THEMES)[number]["value"]

export const BRAND_STORAGE_KEY = "brand-theme"

/**
 * Runs before first paint so a saved brand theme does not flash the default
 * one. next-themes does the same for light and dark mode.
 */
export const BRAND_THEME_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(
  BRAND_STORAGE_KEY
)})==="roastery")document.documentElement.dataset.theme="roastery"}catch(e){}`
