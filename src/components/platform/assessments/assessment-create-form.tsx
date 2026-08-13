"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/platform/shared/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AssessmentCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState("70");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/assessments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            passingScore: passingScore ? Number(passingScore) : null,
          }),
        });
        const data = (await response.json()) as { id?: string; message?: string };
        if (!response.ok || !data.id) {
          setError(data.message ?? "Não foi possível criar a avaliação.");
          return;
        }
        router.push(`/app/assessments/${data.id}`);
        router.refresh();
      } catch {
        setError("Falha de conexão. Tente novamente.");
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Nova avaliação"
        description="Defina o básico e depois adicione as questões."
      />
      <form
        onSubmit={onSubmit}
        className="max-w-xl space-y-4 rounded-[var(--radius-card)] border border-border bg-surface p-5"
      >
        {error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-text-primary">Título</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={2}
            placeholder="Ex.: Prova de introdução"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-text-primary">Descrição</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-[var(--radius-input)] border border-border bg-background px-3 py-2 text-sm"
            placeholder="Instruções para os alunos (opcional)"
          />
        </label>
        <label className="block max-w-[12rem] space-y-1.5">
          <span className="text-sm font-semibold text-text-primary">Nota mínima (%)</span>
          <Input
            type="number"
            min={0}
            max={100}
            value={passingScore}
            onChange={(e) => setPassingScore(e.target.value)}
          />
        </label>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={pending || title.trim().length < 2}>
            Criar avaliação
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/app/assessments")}>
            Cancelar
          </Button>
        </div>
      </form>
    </>
  );
}
