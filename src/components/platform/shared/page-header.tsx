"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPlatformNavContext } from "@/config/platform-navigation";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  eyebrow?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  actionLabel,
  actionHref,
  children,
  footer,
  className,
}: PageHeaderProps) {
  const pathname = usePathname();
  const reduceMotion = usePrefersReducedMotion();
  const navContext = getPlatformNavContext(pathname);
  const Icon = icon ?? navContext.icon;
  const badgeLabel = eyebrow ?? navContext.sectionLabel;

  const hasActions = Boolean(children || (actionLabel && actionHref));

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "platform-page-header relative mb-6 overflow-hidden rounded-[var(--radius-lg)] border border-border/80 md:mb-8",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-surface via-surface to-background-purple-soft"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-soft-light noise-bg"
        aria-hidden
      />

      {!reduceMotion && (
        <>
          <motion.div
            className="pointer-events-none absolute -left-20 -top-24 size-56 rounded-full bg-primary/20 blur-3xl"
            animate={{ x: [0, 14, 0], y: [0, 10, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute -bottom-28 -right-16 size-64 rounded-full bg-secondary/15 blur-3xl"
            animate={{ x: [0, -12, 0], y: [0, -8, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            aria-hidden
          />
        </>
      )}

      <div className="relative p-5 md:p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <motion.div
              className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-light text-white shadow-lg shadow-primary/30 md:size-14"
              whileHover={reduceMotion ? undefined : { scale: 1.06, rotate: -2 }}
              transition={{ type: "spring", stiffness: 380, damping: 18 }}
            >
              <Icon className="size-5 md:size-6" aria-hidden />
              <span
                className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/25"
                aria-hidden
              />
            </motion.div>

            <div className="min-w-0">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08, duration: 0.4 }}
                className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary"
              >
                <Sparkles className="size-3" aria-hidden />
                {badgeLabel}
              </motion.div>

              <motion.h1
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.45 }}
                className="font-[family-name:var(--font-sora)] text-2xl font-bold tracking-tight text-text-primary md:text-3xl"
              >
                {title}
              </motion.h1>

              {description && (
                <motion.p
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.45 }}
                  className="mt-1.5 max-w-2xl text-sm leading-relaxed text-text-secondary md:text-base"
                >
                  {description}
                </motion.p>
              )}
            </div>
          </div>

          {hasActions && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.45 }}
              className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-surface/75 p-2 shadow-soft backdrop-blur-md lg:shrink-0"
            >
              {children}
              {actionLabel && actionHref && (
                <Button
                  asChild
                  className="shadow-md shadow-primary/25 transition-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30"
                >
                  <Link href={actionHref}>
                    <Plus className="size-4" aria-hidden />
                    {actionLabel}
                  </Link>
                </Button>
              )}
            </motion.div>
          )}
        </div>

        {footer && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.45 }}
            className="relative mt-5"
          >
            {footer}
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
