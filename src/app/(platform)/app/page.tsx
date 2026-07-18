import { platformMetadata } from "@/lib/platform/metadata";
import { DashboardHero } from "@/components/platform/dashboard/dashboard-hero";
import { EmptyState } from "@/components/platform/shared/empty-state";

export const metadata = platformMetadata("Visão geral");

export default function DashboardPage() {
  return (
    <div className="space-y-6 md:space-y-8">
      <DashboardHero />
      <EmptyState
        title="Sua plataforma está pronta para começar"
        description="Ainda não há métricas, atividades ou pendências. Crie seu primeiro curso ou convide sua equipe para ver os dados aparecerem aqui."
        actionLabel="Criar curso"
        actionHref="/app/courses/new"
      />
    </div>
  );
}
