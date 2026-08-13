"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CourseListItemDto, PaginatedCoursesDto } from "@eduvy/contracts";
import { PageHeader } from "@/components/platform/shared/page-header";
import { EmptyState } from "@/components/platform/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CourseCardGrid,
  CoursesTable,
  ViewToggle,
} from "@/components/platform/courses/course-list";

const STATUS_FILTERS = [
  { value: "ALL", label: "Todos" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "IN_REVIEW", label: "Em revisão" },
  { value: "PUBLISHED", label: "Publicados" },
  { value: "ARCHIVED", label: "Arquivados" },
] as const;

export function CoursesPageClient({
  initialData,
  error,
}: {
  initialData: PaginatedCoursesDto | null;
  error: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const status = searchParams.get("status") ?? "ALL";
  const items = initialData?.items ?? [];

  const countsLabel = useMemo(() => {
    if (!initialData) return null;
    const { total } = initialData.meta;
    return total === 1 ? "1 curso" : `${total} cursos`;
  }, [initialData]);

  function applyFilters(next: { search?: string; status?: string; page?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.search !== undefined) {
      if (next.search) params.set("search", next.search);
      else params.delete("search");
    }
    if (next.status !== undefined) {
      if (next.status && next.status !== "ALL") params.set("status", next.status);
      else params.delete("status");
    }
    if (next.page) params.set("page", next.page);
    else params.delete("page");

    startTransition(() => {
      router.push(`/app/courses?${params.toString()}`);
    });
  }

  return (
    <>
      <PageHeader
        title="Cursos"
        description="Crie, organize e publique a experiência de aprendizagem da sua organização."
        actionLabel="Criar curso"
        actionHref="/app/courses/new"
      />

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form
          className="flex w-full max-w-md gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters({ search: search.trim(), page: "1" });
          }}
        >
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por título, categoria…"
            aria-label="Buscar cursos"
          />
          <Button type="submit" variant="secondary" disabled={isPending}>
            Buscar
          </Button>
        </form>

        <div className="flex items-center gap-3">
          {countsLabel ? (
            <p className="text-sm text-text-muted" aria-live="polite">
              {countsLabel}
            </p>
          ) : null}
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por status">
        {STATUS_FILTERS.map((filter) => {
          const active = status === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => applyFilters({ status: filter.value, page: "1" })}
              className={
                active
                  ? "rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                  : "rounded-full border border-border-light bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted hover:text-text-primary"
              }
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-[var(--radius-card)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {!error && items.length === 0 ? (
        <EmptyState
          title="Você ainda não criou nenhum curso"
          description="Crie seu primeiro curso e comece a organizar a experiência de aprendizagem dos seus alunos."
          actionLabel="Criar primeiro curso"
          actionHref="/app/courses/new"
        />
      ) : null}

      {!error && items.length > 0 ? (
        <div className={isPending ? "opacity-60 transition-opacity" : undefined}>
          {view === "grid" ? (
            <CourseCardGrid courses={items} />
          ) : (
            <CoursesTable
              courses={items}
              onOpenMenu={(course: CourseListItemDto) => {
                router.push(`/app/courses/${course.id}`);
              }}
            />
          )}
        </div>
      ) : null}

      {initialData && initialData.meta.total > initialData.meta.limit ? (
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="secondary"
            disabled={isPending || initialData.meta.page <= 1}
            onClick={() =>
              applyFilters({ page: String(Math.max(1, initialData.meta.page - 1)) })
            }
          >
            Anterior
          </Button>
          <p className="text-sm text-text-muted">
            Página {initialData.meta.page}
          </p>
          <Button
            variant="secondary"
            disabled={isPending || !initialData.meta.hasMore}
            onClick={() => applyFilters({ page: String(initialData.meta.page + 1) })}
          >
            Próxima
          </Button>
        </div>
      ) : null}
    </>
  );
}
