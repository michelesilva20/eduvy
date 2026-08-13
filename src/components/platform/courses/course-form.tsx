"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CourseDto, CourseVisibilityCode } from "@eduvy/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CourseFormValues = {
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  workloadMinutes: string;
  visibility: CourseVisibilityCode;
};

export function CourseForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: CourseDto;
}) {
  const router = useRouter();
  const [values, setValues] = useState<CourseFormValues>({
    title: initial?.title ?? "",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "",
    workloadMinutes:
      initial?.workloadMinutes !== null && initial?.workloadMinutes !== undefined
        ? String(initial.workloadMinutes)
        : "",
    visibility: initial?.visibility ?? "TENANT",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      title: values.title.trim(),
      shortDescription: values.shortDescription.trim() || undefined,
      description: values.description.trim() || undefined,
      category: values.category.trim() || undefined,
      workloadMinutes: values.workloadMinutes
        ? Number(values.workloadMinutes)
        : undefined,
      visibility: values.visibility,
    };

    try {
      const response = await fetch(
        mode === "create" ? "/api/courses" : `/api/courses/${initial!.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json()) as CourseDto & { message?: string };
      if (!response.ok) {
        setError(data.message ?? "Não foi possível salvar o curso.");
        return;
      }

      setSuccess(mode === "create" ? "Curso criado com sucesso." : "Alterações salvas.");
      router.push(`/app/courses/${data.id}`);
      router.refresh();
    } catch {
      setError("Falha de conexão ao salvar o curso.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-6 md:p-8"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="title">Título do curso</Label>
          <Input
            id="title"
            required
            minLength={2}
            value={values.title}
            onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Ex.: React para iniciantes"
            className="mt-1.5"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="shortDescription">Resumo</Label>
          <Input
            id="shortDescription"
            maxLength={500}
            value={values.shortDescription}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, shortDescription: event.target.value }))
            }
            placeholder="Uma frase que explique o objetivo do curso"
            className="mt-1.5"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <textarea
            id="description"
            rows={5}
            value={values.description}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, description: event.target.value }))
            }
            className="mt-1.5 w-full rounded-2xl border border-border-light bg-surface-light px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Descreva objetivos, público-alvo e o que o aluno vai aprender…"
          />
        </div>

        <div>
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            value={values.category}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, category: event.target.value }))
            }
            placeholder="Ex.: Tecnologia"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="workloadMinutes">Carga horária (minutos)</Label>
          <Input
            id="workloadMinutes"
            type="number"
            min={0}
            value={values.workloadMinutes}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, workloadMinutes: event.target.value }))
            }
            placeholder="Ex.: 720"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="visibility">Visibilidade</Label>
          <select
            id="visibility"
            value={values.visibility}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                visibility: event.target.value as CourseVisibilityCode,
              }))
            }
            className="mt-1.5 h-11 w-full rounded-full border border-border-light px-4 text-sm"
          >
            <option value="TENANT">Organização</option>
            <option value="PRIVATE">Privado</option>
            <option value="UNLISTED">Não listado</option>
          </select>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="mt-4 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(initial ? `/app/courses/${initial.id}` : "/app/courses")}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || values.title.trim().length < 2}>
          {saving
            ? "Salvando…"
            : mode === "create"
              ? "Criar curso"
              : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
