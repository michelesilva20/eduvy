"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { platformNavSections } from "@/config/platform-navigation";
import { EduvyLogo } from "@/components/shared/eduvy-logo";
import { usePlatform } from "./platform-provider";
import { cn } from "@/lib/utils";

function isActiveRoute(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileDrawer() {
  const pathname = usePathname();
  const { mobileNavOpen, setMobileNavOpen } = usePlatform();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-[#3d3654]/30 backdrop-blur-sm transition-opacity lg:hidden",
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden={!mobileNavOpen}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] flex w-[min(100%,18rem)] flex-col bg-surface shadow-floating transition-transform duration-300 lg:hidden",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Menu da plataforma"
        inert={!mobileNavOpen ? true : undefined}
      >
        <div className="flex h-16 items-center justify-between border-b border-border-light px-4">
          <EduvyLogo variant="dark" href="/app" />
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="focus-ring inline-flex size-10 items-center justify-center rounded-xl"
            aria-label="Fechar menu"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {platformNavSections.map((section) => (
            <div key={section.id} className="mb-4">
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveRoute(pathname, item.href);
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        className={cn(
                          "focus-ring flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium",
                          active ? "bg-primary/10 text-primary" : "text-text-muted",
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

export function MobileMenuButton() {
  const { setMobileNavOpen } = usePlatform();
  return (
    <button
      type="button"
      onClick={() => setMobileNavOpen(true)}
      className="focus-ring inline-flex size-10 items-center justify-center rounded-xl text-text-dark lg:hidden"
      aria-label="Abrir menu da plataforma"
    >
      <Menu className="size-5" />
    </button>
  );
}
