import { AppFrame } from "@/components/app-frame";

// page.tsx in this folder is the unmodified output of
// `npx astryx template table-page`. It is kept as scaffolded so the study can
// show what the CLI gives you before any editing. Only this wrapper is ours.
export default function TemplateLayout({ children }: { children: React.ReactNode }) {
  return <AppFrame>{children}</AppFrame>;
}
