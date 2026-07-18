import { platformMetadata } from "@/lib/platform/metadata";
import { PlatformFeaturePage } from "@/components/platform/shared/platform-feature-page";

export const metadata = platformMetadata("Avaliações");

export default function AssessmentsPage() {
  return (
    <PlatformFeaturePage
      title="Avaliações"
      description="Provas, atividades e notas pendentes."
      actionLabel="Nova avaliação"
      actionHref="/app/assessments"
      emptyTitle="Nenhuma avaliação cadastrada"
      emptyDescription="Crie provas e atividades para acompanhar o desempenho dos alunos."
    />
  );
}
