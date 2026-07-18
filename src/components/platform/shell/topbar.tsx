"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  HelpCircle,
  Plus,
  Search,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { quickCreateActions } from "@/config/platform-navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/platform/ui/avatar";
import { MobileMenuButton } from "./mobile-drawer";
import { usePlatform } from "./platform-provider";
import { getInitials } from "@/lib/platform/user-display";

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.replace("/app", "").split("/").filter(Boolean);
  const crumbs = [{ label: "Visão geral", href: "/app" }];
  let path = "/app";
  for (const seg of segments) {
    path += `/${seg}`;
    const label = seg
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label, href: path });
  }
  return crumbs;
}

export function Topbar() {
  const pathname = usePathname();
  const { user, tenantContext } = usePlatform();
  const activeTenant = tenantContext.activeTenant;
  const crumbs = buildBreadcrumbs(pathname);
  const initials = getInitials(user.fullName);

  return (
    <header className="z-40 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur-md md:gap-4 md:px-6">
      <MobileMenuButton />

      <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
        <ol className="flex items-center gap-1.5 text-sm">
          {crumbs.map((crumb, i) => (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-text-muted/50">/</span>}
              {i === crumbs.length - 1 ? (
                <span className="truncate font-medium text-[#3d3654]">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="truncate text-text-muted hover:text-primary">
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 md:max-w-md lg:max-w-lg">
        <div className="relative hidden w-full sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
          <Input
            type="search"
            placeholder="Buscar cursos, alunos, turmas…"
            className="h-10 pl-9"
            aria-label="Busca global"
          />
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button size="sm" className="hidden shrink-0 sm:inline-flex">
              <Plus className="size-4" aria-hidden />
              Criar
              <ChevronDown className="size-3.5 opacity-70" aria-hidden />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[12rem] rounded-xl border border-border-light bg-surface-light p-1.5 shadow-xl"
              align="end"
              sideOffset={8}
            >
              {quickCreateActions.map((action) => (
                <DropdownMenu.Item key={action.href} asChild>
                  <Link
                    href={action.href}
                    className="focus-ring block cursor-pointer rounded-lg px-3 py-2 text-sm text-text-dark outline-none hover:bg-background-light"
                  >
                    {action.label}
                  </Link>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="focus-ring relative inline-flex size-10 items-center justify-center rounded-xl text-text-muted hover:bg-background-light hover:text-text-dark"
              aria-label="Notificações"
            >
              <Bell className="size-5" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="z-50 w-80 rounded-xl border border-border-light bg-surface-light p-4 shadow-xl" align="end" sideOffset={8}>
              <p className="text-sm font-semibold text-[#3d3654]">Notificações</p>
              <p className="mt-2 text-sm text-text-muted">Nenhuma notificação no momento.</p>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <Link
          href="/app/settings"
          className="focus-ring hidden size-10 items-center justify-center rounded-xl text-text-muted hover:bg-background-light sm:inline-flex"
          aria-label="Ajuda"
        >
          <HelpCircle className="size-5" />
        </Link>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button type="button" className="focus-ring flex items-center gap-2 rounded-xl p-1 hover:bg-background-light">
              <Avatar initials={initials} className="size-8" />
              <span className="hidden max-w-[8rem] truncate text-left text-sm font-medium text-[#3d3654] lg:block">
                {user.fullName}
              </span>
              <ChevronDown className="hidden size-4 text-text-muted lg:block" aria-hidden />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="z-50 min-w-[14rem] rounded-xl border border-border-light bg-surface-light p-1.5 shadow-xl" align="end" sideOffset={8}>
              <div className="border-b border-border-light px-3 py-2">
                <p className="text-sm font-semibold">{user.fullName}</p>
                <p className="text-xs text-text-muted">
                  {activeTenant?.name ?? user.email}
                </p>
              </div>
              <DropdownMenu.Item asChild>
                <Link href="/app/settings" className="focus-ring block rounded-lg px-3 py-2 text-sm hover:bg-background-light">Configurações</Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <div className="px-1 py-1">
                  <LogoutButton variant="menu" title="Sair" />
                </div>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
