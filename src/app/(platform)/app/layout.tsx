import type { Metadata } from "next";
import { AppShell } from "@/components/platform/shell/app-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
