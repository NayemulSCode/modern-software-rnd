"use client";

import { AppShell } from "@astryxdesign/core/AppShell";
import { Icon } from "@astryxdesign/core/Icon";
import { VStack } from "@astryxdesign/core/Layout";
import { NavIcon } from "@astryxdesign/core/NavIcon";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Selector } from "@astryxdesign/core/Selector";
import { SideNav, SideNavHeading, SideNavItem, SideNavSection } from "@astryxdesign/core/SideNav";
import {
  ArchiveBoxIcon,
  CubeIcon,
  DocumentTextIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { type ColorMode, type ThemeChoice, useAppearance } from "@/app/providers";

function AppearanceControls() {
  const { mode, setMode, theme, setTheme } = useAppearance();

  return (
    <VStack gap={3} padding={3}>
      <Selector
        label="Theme"
        size="sm"
        variant="secondary"
        width="100%"
        value={theme}
        onChange={(value) => setTheme(value as ThemeChoice)}
        options={[
          { value: "neutral", label: "Neutral theme" },
          { value: "brand", label: "Brand theme" },
        ]}
      />
      <SegmentedControl
        label="Colour mode"
        size="sm"
        value={mode}
        onChange={(value) => setMode(value as ColorMode)}
      >
        <SegmentedControlItem value="system" label="Auto" />
        <SegmentedControlItem value="light" label="Light" />
        <SegmentedControlItem value="dark" label="Dark" />
      </SegmentedControl>
    </VStack>
  );
}

/**
 * The app frame is one Astryx component. AppShell owns the regions, the
 * scroll containers and the switch to a drawer on small screens; nothing here
 * is hand-written layout.
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AppShell
      contentPadding={0}
      sideNav={
        <SideNav
          header={
            <SideNavHeading
              icon={<NavIcon icon={<Icon icon={CubeIcon} size="sm" />} />}
              heading="Roastery Admin"
              headingHref="/"
            />
          }
          footer={<AppearanceControls />}
        >
          <SideNavSection title="Manage" isHeaderHidden>
            <SideNavItem label="Inventory" icon={ArchiveBoxIcon} href="/" isSelected={pathname === "/"} />
            <SideNavItem
              label="Astryx template"
              icon={DocumentTextIcon}
              href="/template"
              isSelected={pathname === "/template"}
            />
            <SideNavItem
              label="About this study"
              icon={InformationCircleIcon}
              href="/about"
              isSelected={pathname === "/about"}
            />
          </SideNavSection>
        </SideNav>
      }
    >
      {children}
    </AppShell>
  );
}
