"use client";

import { PageHeader } from "@/components/platform/shared/page-header";
import { EmptyState } from "@/components/platform/shared/empty-state";

export function StudentsPageClient() {
  return (
    <>
      <PageHeader
        title="Alunos"
        description="Gerencie matrículas, progresso, níveis e engajamento."
        actionLabel="Convidar aluno"
        actionHref="/app/students"
      />
      <EmptyState
        title="Nenhum aluno cadastrado"
        description="Convide alunos ou importe sua base para começar a acompanhar progresso e engajamento."
        actionLabel="Convidar aluno"
        actionHref="/app/students"
      />
    </>
  );
}
