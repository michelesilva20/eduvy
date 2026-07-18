"use client";

import { PageHeader } from "@/components/platform/shared/page-header";
import { usePlatform } from "@/components/platform/shell/platform-provider";
import { getGreeting } from "@/lib/platform/greeting";
import { getFirstName } from "@/lib/platform/user-display";

export function DashboardHero() {
  const { user, tenantContext } = usePlatform();
  const greeting = getGreeting();
  const firstName = getFirstName(user.fullName);
  const tenantName = tenantContext.activeTenant?.name;

  return (
    <PageHeader
      eyebrow={tenantName ?? "Sua organização"}
      title={`${greeting}, ${firstName}. Pronto para continuar evoluindo?`}
      description={
        tenantName
          ? `Você está em ${tenantName}. Configure cursos e convide alunos para começar.`
          : "Vincule-se a uma organização ou crie uma nova para começar."
      }
      actionLabel="Criar curso"
      actionHref="/app/courses/new"
    />
  );
}
