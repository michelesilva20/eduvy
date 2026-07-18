"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, HelpCircle, LogOut } from "lucide-react";
import { platformNavSections } from "@/config/platform-navigation";
import { currentOrganization, currentUser } from "@/mocks/platform";
import { EduvyLogo } from "@/components/shared/eduvy-logo";
import { EduvyLogoImage } from "@/components/brand/eduvy-image";
import { Avatar } from "@/components/platform/ui/avatar";
import { Badge } from "@/components/platform/ui/badge";
import { usePlatform } from "./platform-provider";
import { cn } from "@/lib/utils";

function isActiveRoute(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = usePlatform();

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 flex-col overflow-hidden border-r border-border bg-surface transition-[width] duration-300 lg:flex",
        sidebarCollapsed ? "w-[4.5rem]" : "w-64",
      )}
      aria-label="Navegação da plataforma"
    >
      <div className={cn("flex h-16 shrink-0 items-center border-b border-border-light px-4", sidebarCollapsed && "justify-center px-2")}>
        {sidebarCollapsed ? (
          <Link href="/app" className="focus-ring rounded-lg" aria-label="Eduvy — visão geral">
            <EduvyLogoImage size="sm" />
          </Link>
        ) : (
          <EduvyLogo href="/app" />
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {platformNavSections.map((section) => (
          <div key={section.id} className="mb-5">
            {!sidebarCollapsed && (
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActiveRoute(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={cn(
                        "focus-ring group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-background-purple-soft text-primary"
                          : "text-text-muted hover:bg-background-soft hover:text-text-primary",
                        sidebarCollapsed && "justify-center px-2",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="size-[1.125rem] shrink-0" aria-hidden />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <Badge variant="warning" className="px-1.5 py-0 text-[10px]">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border-light p-3">
        {!sidebarCollapsed && (
          <div className="mb-3 rounded-xl border border-border-light bg-background-light p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Plano</p>
            <p className="mt-1 font-[family-name:var(--font-sora)] text-sm font-bold text-[#3d3654]">
              {currentOrganization.plan}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-light">
              <div className="h-full w-[72%] rounded-full bg-primary" />
            </div>
            <p className="mt-1 text-[10px] text-text-muted">72% do limite de alunos</p>
          </div>
        )}

        <div className={cn("flex items-center gap-2", sidebarCollapsed && "justify-center")}>
          <Avatar initials={currentUser.avatarInitials} />
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#3d3654]">{currentUser.name}</p>
              <p className="truncate text-xs text-text-muted">{currentUser.role}</p>
            </div>
          )}
        </div>

        <div className={cn("mt-2 flex gap-1", sidebarCollapsed ? "flex-col items-center" : "")}>
          <Link
            href="/app/settings"
            title="Ajuda"
            className="focus-ring inline-flex size-9 items-center justify-center rounded-lg text-text-muted hover:bg-background-light hover:text-text-dark"
          >
            <HelpCircle className="size-4" aria-hidden />
          </Link>
          <Link
            href="/login"
            title="Sair"
            className="focus-ring inline-flex size-9 items-center justify-center rounded-lg text-text-muted hover:bg-background-light hover:text-text-dark"
          >
            <LogOut className="size-4" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(
              "focus-ring inline-flex size-9 items-center justify-center rounded-lg text-text-muted hover:bg-background-light hover:text-text-dark",
              !sidebarCollapsed && "ml-auto",
            )}
            aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="size-4" aria-hidden />
            ) : (
              <ChevronLeft className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
