"use client";

import { Layout, LayoutContent, VStack } from "@astryxdesign/core/Layout";
import { Link } from "@astryxdesign/core/Link";
import { Table, type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { Heading, Text } from "@astryxdesign/core/Text";
import { AppFrame } from "@/components/app-frame";

type Requirement = { id: string; requirement: string; builtWith: string } & Record<string, unknown>;

// Which Astryx pieces covered each requirement of the shared test screen
// (docs/comparisons/ui-library-task.md in the repository root).
const REQUIREMENTS: Requirement[] = [
  { id: "1", requirement: "App frame with side navigation", builtWith: "AppShell, SideNav, SideNavItem" },
  {
    id: "2",
    requirement: "Table: sorting, selection, pagination",
    builtWith: "Table with the sortable, selection and pagination plugins; TableSelectionToolbar",
  },
  { id: "3", requirement: "Search, filters, empty state", builtWith: "TextInput, Selector, EmptyState" },
  {
    id: "4",
    requirement: "Create and edit in a dialog with validation",
    builtWith: "Dialog, DialogHeader, TextInput, Selector, NumberInput, Switch (status prop for errors)",
  },
  { id: "5", requirement: "Delete with confirmation and undo", builtWith: "AlertDialog, useToast, ToastViewport" },
  { id: "6", requirement: "Loading state", builtWith: "Skeleton" },
  { id: "7", requirement: "Dark mode and a brand theme", builtWith: "Theme (mode prop), defineTheme({ extends })" },
  { id: "8", requirement: "Small screens and keyboard", builtWith: "AppShell's built-in mobile drawer; native dialog focus handling" },
];

const columns: TableColumn<Requirement>[] = [
  { key: "id", header: "#", width: pixel(56) },
  { key: "requirement", header: "Requirement", width: proportional(1) },
  { key: "builtWith", header: "Built with", width: proportional(2) },
];

export default function AboutPage() {
  return (
    <AppFrame>
      <Layout
        height="fill"
        contentWidth={960}
        content={
          <LayoutContent padding={0} label="About this study">
            <VStack padding={4} gap={6}>
              <VStack gap={2}>
                <Heading level={1}>About this study</Heading>
                <Text color="secondary">
                  This app is the shared UI library test screen, built with Astryx, the open-source design system from
                  Meta. Findings and the verdict are in the README next to the code.
                </Text>
                <Text>
                  Documentation: <Link href="https://astryx.atmeta.com/docs/getting-started">astryx.atmeta.com</Link>
                </Text>
              </VStack>
              <Table<Requirement> data={REQUIREMENTS} columns={columns} idKey="id" textOverflow="wrap" />
            </VStack>
          </LayoutContent>
        }
      />
    </AppFrame>
  );
}
