"use client"

import { useSyncExternalStore } from "react"

import { THEME_STORAGE_KEY, type ThemeChoice } from "@/lib/theme"

const listeners = new Set<() => void>()
const DARK_QUERY = "(prefers-color-scheme: dark)"

function readChoice(): ThemeChoice {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    return saved === "light" || saved === "dark" ? saved : "system"
  } catch {
    return "system"
  }
}

function apply(choice: ThemeChoice) {
  const dark =
    choice === "dark" || (choice === "system" && matchMedia(DARK_QUERY).matches)
  document.documentElement.classList.toggle("dark", dark)
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  const media = matchMedia(DARK_QUERY)
  const onSystemChange = () => {
    if (readChoice() === "system") apply("system")
    onChange()
  }
  media.addEventListener("change", onSystemChange)
  return () => {
    listeners.delete(onChange)
    media.removeEventListener("change", onSystemChange)
  }
}

const NEXT: Record<ThemeChoice, ThemeChoice> = {
  system: "light",
  light: "dark",
  dark: "system",
}

const LABEL: Record<ThemeChoice, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
}

/** Cycles system → light → dark. One button keeps the header small on phones. */
export function ThemeToggle() {
  const choice = useSyncExternalStore(subscribe, readChoice, () => "system" as const)

  function cycle() {
    const next = NEXT[choice]
    try {
      if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY)
      else localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Storage blocked: the mode still changes for this visit.
    }
    apply(next)
    listeners.forEach((notify) => notify())
  }

  return (
    <button
      type="button"
      onClick={cycle}
      className="rounded-md border border-border px-2.5 py-1 text-muted hover:text-foreground"
      aria-label={`Colour mode: ${LABEL[choice]}. Change to ${LABEL[NEXT[choice]]}.`}
    >
      {LABEL[choice]}
    </button>
  )
}
