import { platformMetadata } from "@/lib/platform/metadata";
import { DashboardHero } from "@/components/platform/dashboard/dashboard-hero";
import { StatCard } from "@/components/platform/shared/stat-card";
import { ActivityTimeline } from "@/components/platform/dashboard/activity-timeline";
import { PendingActionsList } from "@/components/platform/dashboard/pending-actions";
import { PlatformAreaChart } from "@/components/platform/charts/area-chart";
import { PlatformBarChart } from "@/components/platform/charts/bar-chart";
import { PlatformCard, PlatformCardBody } from "@/components/platform/shared/platform-card";
import {
  activeStudentsChart,
  completionChart,
  dashboardStats,
  engagementChart,
  pendingActions,
  recentActivities,
} from "@/mocks/platform";

export const metadata = platformMetadata("Visão geral");

export default function DashboardPage() {
  return (
    <div className="space-y-6 md:space-y-8">
      <DashboardHero />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((metric) => (
          <StatCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <PlatformCard className="lg:col-span-2">
          <PlatformCardBody>
            <h2 className="font-[family-name:var(--font-sora)] text-lg font-bold text-text-primary">
              Evolução de alunos ativos
            </h2>
            <PlatformAreaChart data={activeStudentsChart} color="#6d35f2" />
          </PlatformCardBody>
        </PlatformCard>
        <PlatformCard>
          <PlatformCardBody>
            <h2 className="font-[family-name:var(--font-sora)] text-lg font-bold text-text-primary">
              Engajamento semanal
            </h2>
            <PlatformAreaChart data={engagementChart} color="#35c98b" height={220} />
          </PlatformCardBody>
        </PlatformCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PlatformCard>
          <PlatformCardBody>
            <h2 className="mb-2 font-[family-name:var(--font-sora)] text-lg font-bold text-text-primary">
              Taxa de conclusão
            </h2>
            <PlatformBarChart data={completionChart} />
          </PlatformCardBody>
        </PlatformCard>
        <PendingActionsList items={pendingActions} />
      </div>

      <ActivityTimeline items={recentActivities} />
    </div>
  );
}
