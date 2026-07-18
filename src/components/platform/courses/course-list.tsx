"use client";

import { LayoutGrid, List, MoreHorizontal } from "lucide-react";
import type { Course } from "@/types/platform";
import { StatusBadge } from "@/components/platform/ui/badge";
import { Button } from "@/components/ui/button";
import { PlatformCard } from "@/components/platform/shared/platform-card";
import { cn } from "@/lib/utils";

export function CourseCard({ course }: { course: Course }) {
  return (
    <PlatformCard interactive className="overflow-hidden">
      <div className={cn("h-28 bg-gradient-to-br from-primary/20 via-primary-light/20 to-secondary/15")} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{course.category}</p>
            <h3 className="mt-1 font-[family-name:var(--font-sora)] text-base font-bold text-text-primary">
              {course.title}
            </h3>
          </div>
          <StatusBadge status={course.status} />
        </div>
        <p className="mt-2 text-sm text-text-muted">{course.teacherName}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-text-muted">
          <div><dt className="sr-only">Alunos</dt><dd>{course.studentsCount} alunos</dd></div>
          <div><dt className="sr-only">Módulos</dt><dd>{course.modulesCount} módulos</dd></div>
          <div><dt className="sr-only">Carga horária</dt><dd>{course.workloadHours}h</dd></div>
          <div><dt className="sr-only">Atualização</dt><dd>{course.updatedAt}</dd></div>
        </dl>
        <div className="mt-3">
          <div className="flex justify-between text-xs">
            <span>Progresso médio</span>
            <span className="font-semibold text-primary">{course.progressAvg}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background-soft">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light" style={{ width: `${course.progressAvg}%` }} />
          </div>
        </div>
      </div>
    </PlatformCard>
  );
}

export function CoursesTable({ courses }: { courses: Course[] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-soft md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-background-soft text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Curso</th>
              <th className="px-4 py-3 font-semibold">Professor</th>
              <th className="px-4 py-3 font-semibold">Alunos</th>
              <th className="px-4 py-3 font-semibold">Progresso</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Atualização</th>
              <th className="px-4 py-3 font-semibold"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="border-b border-border last:border-0 hover:bg-background-purple-soft/30">
                <td className="px-4 py-3 font-medium text-text-primary">{course.title}</td>
                <td className="px-4 py-3 text-text-muted">{course.teacherName}</td>
                <td className="px-4 py-3">{course.studentsCount}</td>
                <td className="px-4 py-3">{course.progressAvg}%</td>
                <td className="px-4 py-3"><StatusBadge status={course.status} /></td>
                <td className="px-4 py-3 text-text-muted">{course.updatedAt}</td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Ações do curso">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-4 md:hidden">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </>
  );
}

export function ViewToggle({ view, onChange }: { view: "grid" | "table"; onChange: (view: "grid" | "table") => void }) {
  return (
    <div className="inline-flex rounded-2xl border border-border bg-surface p-1">
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={cn(
          "focus-ring inline-flex size-9 items-center justify-center rounded-xl",
          view === "grid" ? "bg-background-purple-soft text-primary" : "text-text-muted",
        )}
        aria-label="Visualização em cards"
        aria-pressed={view === "grid"}
      >
        <LayoutGrid className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        className={cn(
          "focus-ring inline-flex size-9 items-center justify-center rounded-xl",
          view === "table" ? "bg-background-purple-soft text-primary" : "text-text-muted",
        )}
        aria-label="Visualização em tabela"
        aria-pressed={view === "table"}
      >
        <List className="size-4" />
      </button>
    </div>
  );
}

export function CourseCardGrid({ courses }: { courses: Course[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
