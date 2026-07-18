"use client";

import { PageHeader } from "@/components/platform/shared/page-header";
import {
  currentOrganization,
  currentUser,
  getGreeting,
  journeySnapshot,
} from "@/mocks/platform";

export function DashboardHero() {
  const greeting = getGreeting();
  const xpPercent = Math.round((journeySnapshot.xp / journeySnapshot.xpToNext) * 100);

  return (
    <PageHeader
      eyebrow={currentOrganization.name}
      title={`${greeting}, ${currentUser.name.split(" ")[0]}. Pronto para continuar evoluindo?`}
      description={
        <>
          Meta mensal em{" "}
          <strong className="font-semibold text-primary">{journeySnapshot.monthlyProgress}%</strong> · Nível{" "}
          {journeySnapshot.level} da organização
        </>
      }
      actionLabel="Criar curso"
      actionHref="/app/courses/new"
      footer={
        <div className="rounded-2xl border border-primary/10 bg-background-purple-soft/80 p-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-text-primary">Jornada da organização</span>
            <span className="text-text-muted">
              {journeySnapshot.xp.toLocaleString("pt-BR")} XP
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-[width] duration-700 ease-out"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      }
    />
  );
}
