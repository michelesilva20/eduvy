import { PageHeader } from "@/components/platform/shared/page-header";
import { PlatformCard, PlatformCardBody } from "@/components/platform/shared/platform-card";
import { EmptyState } from "@/components/platform/shared/empty-state";

interface PlatformFeaturePageProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  children?: React.ReactNode;
  stats?: { label: string; value: string }[];
}

export function PlatformFeaturePage({
  title,
  description,
  actionLabel,
  actionHref,
  emptyTitle,
  emptyDescription,
  children,
  stats,
}: PlatformFeaturePageProps) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actionLabel={actionLabel}
        actionHref={actionHref}
      />

      {stats && stats.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <PlatformCard key={stat.label}>
              <PlatformCardBody>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{stat.label}</p>
                <p className="mt-1 font-[family-name:var(--font-sora)] text-2xl font-bold text-text-primary">
                  {stat.value}
                </p>
              </PlatformCardBody>
            </PlatformCard>
          ))}
        </div>
      )}

      {children ?? (
        <EmptyState
          title={emptyTitle ?? `Nenhum item em ${title.toLowerCase()}`}
          description={
            emptyDescription ??
            "Layout preparado para integração com API. Os dados aparecerão aqui quando conectados."
          }
          actionLabel={actionLabel}
          actionHref={actionHref}
        />
      )}
    </>
  );
}
