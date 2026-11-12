"use client"

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  setBrandTheme,
  useBrandTheme,
  useIsClient,
} from "@/hooks/use-brand-theme"
import { BRAND_THEMES, type BrandTheme } from "@/lib/brand-theme"

const MODES = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const

export function AppearanceControls() {
  const { theme: mode, setTheme: setMode } = useTheme()
  const brandTheme = useBrandTheme()
  // next-themes only knows the saved mode in the browser. Rendering it during
  // hydration would not match the server HTML.
  const isClient = useIsClient()

  return (
    <FieldGroup className="gap-3 p-2">
      <Field>
        <FieldLabel htmlFor="brand-theme">Theme</FieldLabel>
        <Select
          items={BRAND_THEMES}
          value={brandTheme}
          onValueChange={(value) => setBrandTheme(value as BrandTheme)}
        >
          <SelectTrigger id="brand-theme" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {BRAND_THEMES.map((theme) => (
                <SelectItem key={theme.value} value={theme.value}>
                  {theme.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel id="color-mode-label">Colour mode</FieldLabel>
        <ToggleGroup
          aria-labelledby="color-mode-label"
          variant="outline"
          size="sm"
          spacing={0}
          className="w-full"
          value={isClient && mode ? [mode] : []}
          onValueChange={([next]) => {
            // Base UI lets the active item be switched off; keep one selected.
            if (next) setMode(next)
          }}
        >
          {MODES.map(({ value, label, icon: Icon }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              aria-label={label}
              className="flex-1"
            >
              <Icon aria-hidden="true" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
    </FieldGroup>
  )
}
