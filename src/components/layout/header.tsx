"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigationItems } from "@/data/landing";
import { EduvyLogo } from "@/components/shared/eduvy-logo";
import { Button } from "@/components/ui/button";
import { AnnouncementBar } from "@/components/landing/announcement-bar";
import { MobileMenu } from "./mobile-menu";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50">
        <AnnouncementBar />
        <header
          className={cn(
            "border-b transition-all duration-300",
            scrolled
              ? "border-border-light bg-surface-light/95 shadow-sm backdrop-blur-xl"
              : "border-transparent bg-surface-light/90 backdrop-blur-md",
          )}
        >
          <div
            className={cn(
              "mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-300 md:px-6 lg:px-8",
              scrolled ? "h-14" : "h-16 md:h-[4.5rem]",
            )}
          >
            <EduvyLogo variant="dark" />

            <nav
              className="hidden items-center gap-8 lg:flex"
              aria-label="Navegação principal"
            >
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="focus-ring rounded-md px-1 font-[family-name:var(--font-nunito)] text-sm font-medium text-text-muted transition-colors hover:text-text-dark"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-text-muted hover:text-text-dark"
              >
                <Link href="/login">Entrar</Link>
              </Button>
              <Button size="sm" asChild className="group">
                <Link href="#cta-final">
                  Criar minha plataforma
                  <ArrowRight
                    className="transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </Button>
            </div>

            <button
              type="button"
              className="focus-ring inline-flex size-11 items-center justify-center rounded-xl text-text-dark lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="size-6" aria-hidden />
            </button>
          </div>
        </header>
      </div>

      {/* Espaçador para o conteúdo não ficar atrás do header fixo */}
      <div
        className="h-16 sm:h-[6.75rem] md:h-[7.25rem]"
        aria-hidden
      />

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
