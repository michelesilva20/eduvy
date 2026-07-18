"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/platform/shared/page-header";
import { CourseCardGrid, CoursesTable, ViewToggle } from "@/components/platform/courses/course-list";
import { mockCourses } from "@/mocks/platform";

export function CoursesPageClient() {
  const [view, setView] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    return mockCourses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.teacherName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "all" || course.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [search, status]);

  return (
    <>
      <PageHeader
        title="Cursos"
        description="Gerencie cursos, estrutura, conteúdos e publicação da sua organização."
        actionLabel="Criar curso"
        actionHref="/app/courses/new"
      >
        <ViewToggle view={view} onChange={setView} />
      </PageHeader>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Input
          type="search"
          placeholder="Buscar curso ou professor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
          aria-label="Buscar cursos"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filtrar por status"
        >
          <option value="all">Todos os status</option>
          <option value="published">Publicados</option>
          <option value="draft">Rascunho</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">
          Nenhum curso encontrado com os filtros selecionados.
        </p>
      ) : view === "grid" ? (
        <CourseCardGrid courses={filtered} />
      ) : (
        <CoursesTable courses={filtered} />
      )}
    </>
  );
}
