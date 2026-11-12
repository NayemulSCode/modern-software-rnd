"use client"

import { useSyncExternalStore } from "react"

import { BRAND_STORAGE_KEY, type BrandTheme } from "@/lib/brand-theme"

const listeners = new Set<() => void>()

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  window.addEventListener("storage", onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener("storage", onChange)
  }
}

function readBrandTheme(): BrandTheme {
  try {
    return localStorage.getItem(BRAND_STORAGE_KEY) === "roastery"
      ? "roastery"
      : "neutral"
  } catch {
    // Storage can be blocked (private mode, strict settings).
    return "neutral"
  }
}

export function setBrandTheme(next: BrandTheme) {
  try {
    localStorage.setItem(BRAND_STORAGE_KEY, next)
  } catch {
    // The theme still applies for this visit; it is just not remembered.
  }
  document.documentElement.dataset.theme = next
  listeners.forEach((notify) => notify())
}

/** The saved brand theme. Renders "neutral" on the server and during hydration. */
export function useBrandTheme(): BrandTheme {
  return useSyncExternalStore(subscribe, readBrandTheme, () => "neutral")
}

const subscribeToNothing = () => () => {}

/** False on the server and during hydration, true afterwards. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  )
}
