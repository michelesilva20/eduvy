import { platformMetadata } from "@/lib/platform/metadata";
import { PageHeader } from "@/components/platform/shared/page-header";
import { EmptyState } from "@/components/platform/shared/empty-state";

export const metadata = platformMetadata("Turmas");

export default function ClassesPage() {
  return (
    <>
      <PageHeader
        title="Turmas"
        description="Organize turmas, acompanhe progresso e participação dos alunos."
        actionLabel="Nova turma"
        actionHref="/app/classes"
      />
      <EmptyState
        title="Nenhuma turma criada"
        description="Agrupe alunos por curso, período ou objetivo de aprendizagem."
        actionLabel="Nova turma"
        actionHref="/app/classes"
      />
    </>
  );
}
