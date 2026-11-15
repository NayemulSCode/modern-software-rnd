export const THEME_STORAGE_KEY = "theme"

export type ThemeChoice = "light" | "dark" | "system"

/** Inline script for <head>: sets the `dark` class before first paint. */
export const THEME_SCRIPT = `(function(){try{var c=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});var d=c==="dark"||(c!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`
