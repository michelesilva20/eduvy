"use client";

import Link from "next/link";
import type { MyCourseDto } from "@eduvy/contracts";
import { PageHeader } from "@/components/platform/shared/page-header";
import { EmptyState } from "@/components/platform/shared/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Em andamento",
  COMPLETED: "Concluído",
  PENDING: "Pendente",
  CANCELLED: "Cancelado",
  EXPIRED: "Expirado",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function MyCoursesClient({
  courses,
  error,
}: {
  courses: MyCourseDto[] | null;
  error: string | null;
}) {
  const items = courses ?? [];

  return (
    <>
      <PageHeader
        title="Meus cursos"
        description="Continue de onde parou nas turmas em que você está matriculado."
      />

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-[var(--radius-card)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {!error && items.length === 0 ? (
        <EmptyState
          title="Nenhuma matrícula ativa"
          description="Quando você for matriculado em uma turma, os cursos aparecerão aqui."
        />
      ) : null}

      {items.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((course) => (
            <li
              key={course.enrollmentId}
              className="flex flex-col rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-[family-name:var(--font-sora)] text-lg font-bold text-text-primary">
                    {course.courseTitle}
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">{course.cohortName}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                    course.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {STATUS_LABEL[course.status] ?? course.status}
                </span>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs text-text-muted">
                  <span>Progresso</span>
                  <span className="font-semibold text-text-primary">
                    {course.progressPercentage}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-background-soft">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all"
                    style={{ width: `${course.progressPercentage}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-text-muted">
                  {course.completedLessons}/{course.totalLessons} aulas · último acesso{" "}
                  {formatDate(course.lastAccessAt)}
                </p>
                {course.leadInstructorName ? (
                  <p className="mt-1 text-xs text-text-muted">
                    Professor: {course.leadInstructorName}
                  </p>
                ) : null}
              </div>

              <div className="mt-5">
                <Button asChild className="w-full">
                  <Link href={`/app/learning/${course.enrollmentId}`}>
                    {course.progressPercentage > 0 ? "Continuar" : "Começar"}
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
