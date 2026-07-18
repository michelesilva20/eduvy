import { platformMetadata } from "@/lib/platform/metadata";
import { PageHeader } from "@/components/platform/shared/page-header";
import { EmptyState } from "@/components/platform/shared/empty-state";

export const metadata = platformMetadata("Professores");

export default function TeachersPage() {
  return (
    <>
      <PageHeader
        title="Professores"
        description="Acompanhe carga de trabalho, turmas e pendências de correção."
        actionLabel="Novo professor"
        actionHref="/app/teachers"
      />
      <EmptyState
        title="Nenhum professor cadastrado"
        description="Adicione professores para atribuir cursos, turmas e correções."
        actionLabel="Novo professor"
        actionHref="/app/teachers"
      />
    </>
  );
}
