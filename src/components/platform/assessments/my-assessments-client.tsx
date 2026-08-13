"use client";

import Link from "next/link";
import type { AvailableAssessmentDto } from "@eduvy/contracts";
import { ClipboardCheck, Clock3, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function MyAssessmentsClient({
  items,
}: {
  items: AvailableAssessmentDto[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-6 py-16 text-center">
        <ClipboardCheck className="mx-auto size-10 text-text-muted" aria-hidden />
        <h2 className="mt-4 font-[family-name:var(--font-sora)] text-lg font-semibold text-text-primary">
          Nenhuma avaliação disponível
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Quando uma avaliação for atribuída à sua turma, ela aparecerá aqui.
        </p>
      </div>
    );
  }

  const inProgress = items.filter((item) => item.currentAttemptStatus === "IN_PROGRESS");
  const pending = items.filter(
    (item) =>
      item.currentAttemptStatus !== "IN_PROGRESS" &&
      (item.attemptsRemaining == null || item.attemptsRemaining > 0),
  );
  const completed = items.filter(
    (item) =>
      item.currentAttemptStatus !== "IN_PROGRESS" &&
      item.attemptsRemaining === 0,
  );

  return (
    <div className="space-y-10">
      <Section title="Em andamento" items={inProgress} />
      <Section title="Pendentes" items={pending} />
      <Section title="Concluídas / sem tentativas" items={completed} done />
    </div>
  );
}

function Section({
  title,
  items,
  done,
}: {
  title: string;
  items: AvailableAssessmentDto[];
  done?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 font-[family-name:var(--font-sora)] text-lg font-semibold text-text-primary">
        {title}
      </h2>
      <ul className="space-y-3">
        {items.map((item) => {
          const deadline = formatDate(item.availableUntil);
          const cta =
            item.currentAttemptStatus === "IN_PROGRESS"
              ? "Continuar"
              : item.attemptsRemaining === 0
                ? "Sem tentativas"
                : "Iniciar avaliação";
          const disabled = item.attemptsRemaining === 0 && !item.currentAttemptId;

          return (
            <li
              key={item.assignmentId}
              className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-[family-name:var(--font-sora)] text-base font-semibold text-text-primary">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-text-secondary">Turma: {item.cohortName}</p>
                {item.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                    {item.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                  {deadline && (
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="size-3.5" aria-hidden />
                      Prazo: {deadline}
                    </span>
                  )}
                  <span>
                    Tentativas: {item.attemptsUsed}
                    {item.maxAttempts != null ? ` de ${item.maxAttempts}` : ""}{" "}
                    utilizadas
                  </span>
                  <span>{item.questionsCount} questões</span>
                  {item.timeLimitMinutes != null && (
                    <span>{item.timeLimitMinutes} min</span>
                  )}
                  {item.required && <span>Obrigatória</span>}
                </div>
              </div>
              <Button asChild disabled={disabled} variant={done ? "outline" : "default"}>
                <Link href={`/app/assessments/assignments/${item.assignmentId}/take`}>
                  <PlayCircle className="size-4" aria-hidden />
                  {cta}
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
