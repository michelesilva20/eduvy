import { platformMetadata } from "@/lib/platform/metadata";
import { PageHeader } from "@/components/platform/shared/page-header";
import { EmptyState } from "@/components/platform/shared/empty-state";

export const metadata = platformMetadata("Relatórios");

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Relatórios" description="Visão consolidada de desempenho, engajamento e conclusão." />
      <EmptyState
        title="Sem dados para relatórios"
        description="Métricas de engajamento, conclusão e insights serão exibidas quando sua operação tiver atividade registrada."
        actionLabel="Ir para cursos"
        actionHref="/app/courses"
      />
    </>
  );
}
