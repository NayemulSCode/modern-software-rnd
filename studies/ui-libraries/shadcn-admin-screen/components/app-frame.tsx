"use client"

import { CoffeeIcon, InfoIcon, PackageIcon, PaletteIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { AppearanceControls } from "@/components/appearance-controls"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const DESTINATIONS = [
  { href: "/", label: "Inventory", icon: PackageIcon },
  { href: "/theme", label: "Theme tokens", icon: PaletteIcon },
  { href: "/about", label: "About this study", icon: InfoIcon },
] as const

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const current = DESTINATIONS.find((item) => item.href === pathname)

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <CoffeeIcon className="size-4" aria-hidden="true" />
            </div>
            <span className="font-heading text-sm font-semibold">
              Roastery Admin
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {DESTINATIONS.map(({ href, label, icon: Icon }) => (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      isActive={href === pathname}
                      render={
                        <Link
                          href={href}
                          aria-current={href === pathname ? "page" : undefined}
                        />
                      }
                    >
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <AppearanceControls />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <span className="text-sm text-muted-foreground">
            {current?.label ?? "Roastery Admin"}
          </span>
        </header>
        <main className="mx-auto w-full max-w-[1200px] min-w-0 flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
