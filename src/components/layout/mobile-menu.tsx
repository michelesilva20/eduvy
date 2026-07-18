"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { navigationItems } from "@/data/landing";
import { EduvyLogo } from "@/components/shared/eduvy-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[70] bg-text-dark/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden={!open}
      />
      <div
        id="mobile-menu"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className={cn(
          "fixed inset-y-0 right-0 z-[80] flex w-full max-w-sm flex-col bg-surface-light p-6 shadow-2xl transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "translate-x-full",
        )}
        inert={!open ? true : undefined}
      >
        <div className="flex items-center justify-between">
          <EduvyLogo variant="dark" />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="focus-ring inline-flex size-11 items-center justify-center rounded-xl text-text-dark"
            aria-label="Fechar menu de navegação"
          >
            <X className="size-6" aria-hidden />
          </button>
        </div>

        <nav className="mt-10 flex flex-col gap-1" aria-label="Navegação mobile">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="focus-ring rounded-xl px-3 py-3 font-[family-name:var(--font-nunito)] text-lg font-medium text-text-dark hover:bg-background-light"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 pt-8">
          <Button variant="secondary" asChild className="w-full">
            <Link href="/login" onClick={onClose}>
              Entrar
            </Link>
          </Button>
          <Button asChild className="group w-full">
            <Link href="#cta-final" onClick={onClose}>
              Criar minha plataforma
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
