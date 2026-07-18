"use client";

import type { AuthUserDto, TenantContextDto } from "@eduvy/contracts";
import { PlatformProvider } from "./platform-provider";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileDrawer } from "./mobile-drawer";

export function AppShell({
  children,
  user,
  tenantContext,
}: {
  children: React.ReactNode;
  user: AuthUserDto;
  tenantContext: TenantContextDto;
}) {
  return (
    <PlatformProvider user={user} tenantContext={tenantContext}>
      <div className="flex h-screen overflow-hidden bg-background-soft">
        <Sidebar />
        <MobileDrawer />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar />
          <main
            id="conteudo-principal"
            className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"
          >
            {children}
          </main>
        </div>
      </div>
    </PlatformProvider>
  );
}
