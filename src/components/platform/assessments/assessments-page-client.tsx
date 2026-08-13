"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { PaginatedAssessmentsDto } from "@eduvy/contracts";
import { PageHeader } from "@/components/platform/shared/page-header";
import { EmptyState } from "@/components/platform/shared/empty-state";
import { StatusBadge } from "@/components/platform/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "ALL", label: "Todas" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "PUBLISHED", label: "Publicadas" },
  { value: "ARCHIVED", label: "Arquivadas" },
] as const;

export function AssessmentsPageClient({
  initialData,
  error,
}: {
  initialData: PaginatedAssessmentsDto | null;
  error: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const status = searchParams.get("status") ?? "ALL";
  const items = initialData?.items ?? [];

  function applyFilters(next: { search?: string; status?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.search !== undefined) {
      if (next.search) params.set("search", next.search);
      else params.delete("search");
    }
    if (next.status !== undefined) {
      if (next.status && next.status !== "ALL") params.set("status", next.status);
      else params.delete("status");
    }
    params.delete("page");
    startTransition(() => {
      router.push(`/app/assessments?${params.toString()}`);
    });
  }

  return (
    <>
      <PageHeader
        title="Avaliações"
        description="Crie provas e atividades com questões reutilizáveis."
        actionLabel="Nova avaliação"
        actionHref="/app/assessments/new"
      />

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-[var(--radius-card)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form
          className="flex w-full max-w-md gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters({ search: search.trim() });
          }}
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar avaliação…"
          />
          <Button type="submit" variant="secondary" disabled={isPending}>
            Buscar
          </Button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => applyFilters({ status: item.value })}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                status === item.value
                  ? "bg-primary text-white"
                  : "bg-background-soft text-text-muted hover:text-text-primary",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {!error && items.length === 0 ? (
        <EmptyState
          title="Nenhuma avaliação cadastrada"
          description="Crie provas e atividades para acompanhar o desempenho dos alunos."
          actionLabel="Nova avaliação"
          actionHref="/app/assessments/new"
        />
      ) : null}

      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-background-soft/60 text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Título</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Questões</th>
                <th className="px-4 py-3 font-semibold">Nota mínima</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/assessments/${item.id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-text-muted">{item.questionsCount}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {item.passingScore != null ? `${item.passingScore}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
