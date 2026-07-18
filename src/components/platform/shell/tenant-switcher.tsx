"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import { usePlatform } from "./platform-provider";
import { cn } from "@/lib/utils";

interface TenantSwitcherProps {
  compact?: boolean;
  className?: string;
}

export function TenantSwitcher({ compact = false, className }: TenantSwitcherProps) {
  const { tenantContext, switchingTenant, switchTenant } = usePlatform();
  const { activeTenant, tenants } = tenantContext;

  if (!activeTenant) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border-light bg-background-light px-3 py-2 text-xs text-text-muted",
          className,
        )}
      >
        Nenhuma organização vinculada
      </div>
    );
  }

  if (tenants.length <= 1) {
    return (
      <div className={cn("min-w-0", className)}>
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background-purple-soft text-primary">
            <Building2 className="size-4" aria-hidden />
          </span>
          {!compact && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#3d3654]">{activeTenant.name}</p>
              <p className="truncate text-[11px] text-text-muted">
                {activeTenant.planName ?? "Plano não definido"}
                {activeTenant.roleName ? ` · ${activeTenant.roleName}` : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          disabled={switchingTenant}
          className={cn(
            "focus-ring flex w-full items-center gap-2 rounded-xl border border-border-light bg-background-light px-3 py-2 text-left transition-colors hover:bg-background-soft disabled:opacity-60",
            className,
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background-purple-soft text-primary">
            {switchingTenant ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Building2 className="size-4" aria-hidden />
            )}
          </span>
          {!compact && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#3d3654]">
                  {activeTenant.name}
                </span>
                <span className="block truncate text-[11px] text-text-muted">
                  {activeTenant.planName ?? "Plano não definido"}
                </span>
              </span>
              <ChevronDown className="size-4 shrink-0 text-text-muted" aria-hidden />
            </>
          )}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[14rem] rounded-xl border border-border-light bg-surface-light p-1.5 shadow-xl"
          align="start"
          sideOffset={8}
        >
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Organizações
          </p>
          {tenants.map((tenant) => {
            const selected = tenant.id === activeTenant.id;
            return (
              <DropdownMenu.Item
                key={tenant.id}
                className="focus-ring cursor-pointer rounded-lg px-2 py-2 outline-none hover:bg-background-light"
                onSelect={() => void switchTenant(tenant.id)}
              >
                <span className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                    {selected ? <Check className="size-3.5 text-primary" aria-hidden /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-text-primary">
                      {tenant.name}
                    </span>
                    <span className="block truncate text-xs text-text-muted">
                      {tenant.planName ?? "Plano não definido"}
                    </span>
                  </span>
                </span>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
