"use client";

import { PageHeader } from "@/components/platform/shared/page-header";
import { EmptyState } from "@/components/platform/shared/empty-state";

export function CoursesPageClient() {
  return (
    <>
      <PageHeader
        title="Cursos"
        description="Gerencie cursos, estrutura, conteúdos e publicação da sua organização."
        actionLabel="Criar curso"
        actionHref="/app/courses/new"
      />
      <EmptyState
        title="Nenhum curso criado"
        description="Monte trilhas, módulos e conteúdos para sua operação de ensino."
        actionLabel="Criar curso"
        actionHref="/app/courses/new"
      />
    </>
  );
}
