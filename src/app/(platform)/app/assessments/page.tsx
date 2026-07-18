import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { platformMetadata } from "@/lib/platform/metadata";
import { PlatformFeaturePage } from "@/components/platform/shared/platform-feature-page";
import { pendingActions } from "@/mocks/platform";

export const metadata = platformMetadata("Avaliações");

export default function AssessmentsPage() {
  const pending = pendingActions.find((p) => p.id === "p2");

  return (
    <PlatformFeaturePage
      title="Avaliações"
      description="Provas, atividades e notas pendentes."
      actionLabel="Nova avaliação"
      actionHref="/app/assessments"
    >
      {pending && (
        <Link
          href={pending.href}
          className="mb-6 flex items-center justify-between rounded-[var(--radius-card)] border border-warning/30 bg-warning-soft px-5 py-4 shadow-soft"
        >
          <span className="text-sm font-semibold text-text-primary">
            {pending.title} ({pending.count})
          </span>
          <ChevronRight className="size-4" />
        </Link>
      )}
      <p className="text-sm text-text-muted">Listagem de avaliações mockada — pronta para API.</p>
    </PlatformFeaturePage>
  );
}
