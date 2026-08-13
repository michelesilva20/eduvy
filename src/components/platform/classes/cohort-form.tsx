"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CourseListItemDto, PaginatedCoursesDto } from "@eduvy/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/platform/shared/page-header";

export function CohortForm() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseListItemDto[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [courseId, setCourseId] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/courses?limit=50&status=PUBLISHED")
      .then(async (response) => {
        if (!response.ok) {
          const publishedFallback = await fetch("/api/courses?limit=50");
          if (!publishedFallback.ok) return;
          const data = (await publishedFallback.json()) as PaginatedCoursesDto;
          setCourses(data.items);
          if (data.items[0]) setCourseId(data.items[0].id);
          return;
        }
        const data = (await response.json()) as PaginatedCoursesDto;
        setCourses(data.items);
        if (data.items[0]) setCourseId(data.items[0].id);
      })
      .catch(() => {
        setError("Não foi possível carregar os cursos.");
      });
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || undefined,
          courseId,
          maxStudents: maxStudents ? Number(maxStudents) : undefined,
        }),
      });
      const data = (await response.json()) as { id?: string; message?: string };
      if (!response.ok) {
        setError(data.message ?? "Não foi possível criar a turma.");
        return;
      }
      router.push(`/app/classes/${data.id}`);
      router.refresh();
    } catch {
      setError("Falha de conexão ao criar a turma.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Nova turma"
        description="Vincule a turma a um curso e prepare o ciclo de matrículas."
      />

      <form
        onSubmit={onSubmit}
        className="max-w-xl space-y-4 rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5"
      >
        <div className="space-y-2">
          <Label htmlFor="cohort-name">Nome</Label>
          <Input
            id="cohort-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            placeholder="React — Agosto 2026"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cohort-code">Código (opcional)</Label>
          <Input
            id="cohort-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="REACT-AGO-26"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cohort-course">Curso</Label>
          <select
            id="cohort-course"
            required
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-light bg-background px-3 text-sm"
          >
            {courses.length === 0 ? <option value="">Nenhum curso disponível</option> : null}
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} ({course.status})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cohort-max">Limite de alunos (opcional)</Label>
          <Input
            id="cohort-max"
            type="number"
            min={1}
            value={maxStudents}
            onChange={(e) => setMaxStudents(e.target.value)}
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving || !courseId || !name.trim()}>
            Criar turma
          </Button>
          <Button type="button" variant="secondary" disabled={saving} onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </>
  );
}
