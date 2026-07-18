import { platformMetadata } from "@/lib/platform/metadata";
import { PageHeader } from "@/components/platform/shared/page-header";
import { StatCard } from "@/components/platform/shared/stat-card";
import { PlatformCard, PlatformCardBody } from "@/components/platform/shared/platform-card";
import { PlatformAreaChart } from "@/components/platform/charts/area-chart";
import { dashboardStats, engagementChart } from "@/mocks/platform";

export const metadata = platformMetadata("Relatórios");

const insights = [
  "Engajamento subiu na última semana — Turma Redação lidera participação.",
  "Taxa de conclusão consistente com o período anterior.",
  "Alunos inativos há mais de 7 dias — considere campanha de reengajamento.",
];

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Relatórios" description="Visão consolidada de desempenho, engajamento e conclusão." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.slice(0, 4).map((m) => (
          <StatCard key={m.id} metric={m} />
        ))}
      </div>

      <div className="space-y-6">
        <PlatformCard>
          <PlatformCardBody>
            <h2 className="font-[family-name:var(--font-sora)] text-lg font-bold text-text-primary">Engajamento</h2>
            <PlatformAreaChart data={engagementChart} color="#35c98b" />
          </PlatformCardBody>
        </PlatformCard>

        <PlatformCard>
          <PlatformCardBody>
            <h2 className="font-[family-name:var(--font-sora)] text-lg font-bold text-text-primary">Insights</h2>
            <ul className="mt-4 space-y-3 text-sm text-text-secondary">
              {insights.map((text) => (
                <li key={text} className="rounded-xl border border-border bg-background-soft px-4 py-3">{text}</li>
              ))}
            </ul>
          </PlatformCardBody>
        </PlatformCard>
      </div>
    </>
  );
}
