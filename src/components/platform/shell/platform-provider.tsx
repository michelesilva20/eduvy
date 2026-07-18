"use client";

import type { AuthUserDto, TenantContextDto, TenantSummaryDto } from "@eduvy/contracts";
import { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface PlatformContextValue {
  user: AuthUserDto;
  tenantContext: TenantContextDto;
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  switchingTenant: boolean;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
  switchTenant: (tenantId: string) => Promise<void>;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({
  children,
  user,
  tenantContext,
}: {
  children: React.ReactNode;
  user: AuthUserDto;
  tenantContext: TenantContextDto;
}) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [context, setContext] = useState(tenantContext);
  const [switchingTenant, setSwitchingTenant] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const switchTenant = useCallback(
    async (tenantId: string) => {
      if (tenantId === context.activeTenant?.id) return;

      setSwitchingTenant(true);
      try {
        const response = await fetch("/api/tenants/active", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantId }),
        });

        if (!response.ok) return;

        const nextContext = (await response.json()) as TenantContextDto;
        setContext(nextContext);
        router.refresh();
      } finally {
        setSwitchingTenant(false);
      }
    },
    [context.activeTenant?.id, router],
  );

  return (
    <PlatformContext.Provider
      value={{
        user,
        tenantContext: context,
        sidebarCollapsed,
        mobileNavOpen,
        switchingTenant,
        toggleSidebar,
        setMobileNavOpen,
        switchTenant,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatform must be used within PlatformProvider");
  return ctx;
}

export function useActiveTenant(): TenantSummaryDto | null {
  return usePlatform().tenantContext.activeTenant;
}
