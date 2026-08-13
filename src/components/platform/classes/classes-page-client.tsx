"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { PaginatedCohortsDto } from "@eduvy/contracts";
import { PageHeader } from "@/components/platform/shared/page-header";
import { EmptyState } from "@/components/platform/shared/empty-state";
import { StatusBadge } from "@/components/platform/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "ALL", label: "Todas" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "OPEN", label: "Abertas" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "COMPLETED", label: "Concluídas" },
  { value: "ARCHIVED", label: "Arquivadas" },
] as const;

export function ClassesPageClient({
  initialData,
  error,
}: {
  initialData: PaginatedCohortsDto | null;
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
      router.push(`/app/classes?${params.toString()}`);
    });
  }

  return (
    <>
      <PageHeader
        title="Turmas"
        description="Organize turmas, acompanhe progresso e participação dos alunos."
        actionLabel="Nova turma"
        actionHref="/app/classes/new"
      />

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
            placeholder="Buscar turmas…"
            aria-label="Buscar turmas"
          />
          <Button type="submit" variant="secondary" disabled={isPending}>
            Buscar
          </Button>
        </form>

        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              disabled={isPending}
              onClick={() => applyFilters({ status: filter.value })}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                status === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-background-soft text-text-muted hover:text-text-primary",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {!error && items.length === 0 ? (
        <EmptyState
          title="Nenhuma turma criada"
          description="Agrupe alunos por curso, período ou objetivo de aprendizagem."
          actionLabel="Nova turma"
          actionHref="/app/classes/new"
        />
      ) : null}

      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border-light">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border-light bg-background-soft/60 text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Turma</th>
                <th className="px-4 py-3 font-semibold">Curso</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Alunos</th>
                <th className="px-4 py-3 font-semibold">Professores</th>
              </tr>
            </thead>
            <tbody>
              {items.map((cohort) => (
                <tr key={cohort.id} className="border-b border-border-light last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/classes/${cohort.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {cohort.name}
                    </Link>
                    {cohort.code ? (
                      <span className="mt-0.5 block text-xs text-text-muted">{cohort.code}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {cohort.courseTitle}
                    <span className="mt-0.5 block text-xs text-text-muted">
                      v{cohort.courseVersion}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={cohort.status} />
                  </td>
                  <td className="px-4 py-3 text-text-muted">{cohort.studentsCount}</td>
                  <td className="px-4 py-3 text-text-muted">{cohort.instructorsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
