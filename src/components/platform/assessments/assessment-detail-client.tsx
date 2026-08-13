"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  AssessmentAssignmentDto,
  AssessmentDto,
  CohortListItemDto,
  QuestionTypeCode,
  ResultVisibilityCode,
} from "@eduvy/contracts";
import { ArrowLeft } from "lucide-react";
import { AssessmentResultsPanel } from "@/components/platform/assessments/assessment-results-panel";
import { PageHeader } from "@/components/platform/shared/page-header";
import { StatusBadge } from "@/components/platform/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const QUESTION_TYPES: Array<{ value: QuestionTypeCode; label: string }> = [
  { value: "SINGLE_CHOICE", label: "Múltipla escolha (uma correta)" },
  { value: "MULTIPLE_CHOICE", label: "Múltipla escolha (várias corretas)" },
  { value: "TRUE_FALSE", label: "Verdadeiro / Falso" },
  { value: "SHORT_TEXT", label: "Resposta curta" },
];

const RESULT_OPTIONS: Array<{ value: ResultVisibilityCode; label: string }> = [
  { value: "AFTER_SUBMISSION", label: "Após o envio" },
  { value: "IMMEDIATE", label: "Imediato" },
  { value: "AFTER_DEADLINE", label: "Após o prazo" },
  { value: "MANUAL", label: "Liberação manual" },
];

export function AssessmentDetailClient({
  assessment,
  assignments,
  cohorts,
}: {
  assessment: AssessmentDto;
  assignments: AssessmentAssignmentDto[];
  cohorts: CohortListItemDto[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [stem, setStem] = useState("");
  const [type, setType] = useState<QuestionTypeCode>("SINGLE_CHOICE");
  const [optionA, setOptionA] = useState("Alternativa A");
  const [optionB, setOptionB] = useState("Alternativa B");
  const [correct, setCorrect] = useState<"A" | "B">("A");

  const [cohortId, setCohortId] = useState(cohorts[0]?.id ?? "");
  const [attemptsAllowed, setAttemptsAllowed] = useState("2");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [resultVisibility, setResultVisibility] =
    useState<ResultVisibilityCode>("AFTER_SUBMISSION");

  const assignedCohortIds = new Set(assignments.map((a) => a.cohortId));
  const availableCohorts = cohorts.filter((c) => !assignedCohortIds.has(c.id));
  const questionsLocked = assessment.status === "PUBLISHED" && assignments.length > 0;

  async function runAction(path: string, success: string, method = "POST", body?: unknown) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch(path, {
          method,
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });
        const data = (await response.json()) as { message?: string };
        if (!response.ok) {
          setError(data.message ?? "Não foi possível concluir a ação.");
          return;
        }
        setMessage(success);
        router.refresh();
      } catch {
        setError("Falha de conexão. Tente novamente.");
      }
    });
  }

  function addQuestion() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const payload =
          type === "SHORT_TEXT"
            ? { stem: stem.trim(), type, points: 1 }
            : type === "TRUE_FALSE"
              ? {
                  stem: stem.trim(),
                  type,
                  options: [
                    { text: "Verdadeiro", isCorrect: correct === "A" },
                    { text: "Falso", isCorrect: correct === "B" },
                  ],
                  points: 1,
                }
              : {
                  stem: stem.trim(),
                  type,
                  options: [
                    { text: optionA.trim(), isCorrect: correct === "A" },
                    { text: optionB.trim(), isCorrect: correct === "B" },
                  ],
                  points: 1,
                };

        const createRes = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = (await createRes.json()) as { id?: string; message?: string };
        if (!createRes.ok || !created.id) {
          setError(created.message ?? "Não foi possível criar a questão.");
          return;
        }

        const attachRes = await fetch(`/api/assessments/${assessment.id}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: created.id }),
        });
        const attached = (await attachRes.json()) as { message?: string };
        if (!attachRes.ok) {
          setError(attached.message ?? "Questão criada, mas falhou ao vincular.");
          return;
        }

        setStem("");
        setMessage("Questão adicionada à avaliação.");
        router.refresh();
      } catch {
        setError("Falha de conexão. Tente novamente.");
      }
    });
  }

  function createAssignment() {
    if (!cohortId) {
      setError("Selecione uma turma.");
      return;
    }
    runAction(
      `/api/assessments/${assessment.id}/assignments`,
      "Avaliação atribuída à turma.",
      "POST",
      {
        cohortId,
        attemptsAllowed: attemptsAllowed ? Number(attemptsAllowed) : null,
        timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
        availableUntil: availableUntil ? new Date(availableUntil).toISOString() : null,
        resultVisibility,
      },
    );
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href="/app/assessments"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Avaliações
        </Link>
      </div>

      <PageHeader title={assessment.title} description={assessment.description ?? undefined} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={assessment.status} />
        <span className="text-sm text-text-muted">
          {assessment.questionsCount}{" "}
          {assessment.questionsCount === 1 ? "questão" : "questões"}
        </span>
        <span className="text-sm text-text-muted">
          {assignments.length}{" "}
          {assignments.length === 1 ? "atribuição" : "atribuições"}
        </span>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {assessment.status !== "PUBLISHED" && assessment.status !== "ARCHIVED" ? (
          <Button
            disabled={pending}
            onClick={() =>
              runAction(`/api/assessments/${assessment.id}/publish`, "Avaliação publicada.")
            }
          >
            Publicar
          </Button>
        ) : null}
        {assessment.status !== "ARCHIVED" ? (
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() =>
              runAction(`/api/assessments/${assessment.id}/archive`, "Avaliação arquivada.")
            }
          >
            Arquivar
          </Button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="mb-4 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <section className="mb-6 space-y-3 rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-text-muted">
          Atribuições
        </h2>
        {assessment.status !== "PUBLISHED" ? (
          <p className="text-sm text-text-muted">
            Publique a avaliação para atribuí-la a turmas.
          </p>
        ) : null}

        {assignments.length === 0 ? (
          <p className="text-sm text-text-muted">
            Ainda não há atribuições. Os alunos só verão a avaliação após o vínculo com a
            turma.
          </p>
        ) : (
          <ul className="space-y-2">
            {assignments.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-text-primary">{item.cohortName}</p>
                  <p className="text-xs text-text-muted">
                    {item.isActive ? "Ativa" : "Inativa"} · tentativas{" "}
                    {item.attemptsAllowed ?? "ilimitadas"} · resultado{" "}
                    {RESULT_OPTIONS.find((o) => o.value === item.resultVisibility)?.label}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    runAction(
                      `/api/assessment-assignments/${item.id}`,
                      item.isActive ? "Atribuição desativada." : "Atribuição reativada.",
                      "PATCH",
                      { isActive: !item.isActive },
                    )
                  }
                >
                  {item.isActive ? "Desativar" : "Reativar"}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {assessment.status === "PUBLISHED" && availableCohorts.length > 0 ? (
          <div className="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Turma</span>
              <select
                value={cohortId}
                onChange={(e) => setCohortId(e.target.value)}
                className="h-10 w-full rounded-[var(--radius-input)] border border-border bg-background px-3 text-sm"
              >
                {availableCohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Tentativas permitidas</span>
              <Input
                type="number"
                min={1}
                value={attemptsAllowed}
                onChange={(e) => setAttemptsAllowed(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Tempo limite (min)</span>
              <Input
                type="number"
                min={1}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value)}
                placeholder="Opcional"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Disponível até</span>
              <Input
                type="datetime-local"
                value={availableUntil}
                onChange={(e) => setAvailableUntil(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5 md:col-span-2">
              <span className="text-sm font-semibold">Visibilidade do resultado</span>
              <select
                value={resultVisibility}
                onChange={(e) =>
                  setResultVisibility(e.target.value as ResultVisibilityCode)
                }
                className="h-10 w-full max-w-md rounded-[var(--radius-input)] border border-border bg-background px-3 text-sm"
              >
                {RESULT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="md:col-span-2">
              <Button disabled={pending || !cohortId} onClick={createAssignment}>
                Atribuir à turma
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <AssessmentResultsPanel assessmentId={assessment.id} />

      <section className="mb-6 space-y-3 rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-text-muted">Questões</h2>
        {assessment.questions.length === 0 ? (
          <p className="text-sm text-text-muted">Nenhuma questão vinculada ainda.</p>
        ) : (
          <ol className="space-y-2">
            {assessment.questions.map((item, index) => (
              <li
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">
                    {index + 1}. {item.question.stem}
                  </p>
                  <p className="text-xs text-text-muted">
                    {item.question.type} · {item.question.points} pt
                  </p>
                </div>
                {assessment.status !== "ARCHIVED" && !questionsLocked ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    disabled={pending}
                    onClick={() =>
                      runAction(
                        `/api/assessments/${assessment.id}/questions/${item.questionId}`,
                        "Questão removida.",
                        "DELETE",
                      )
                    }
                  >
                    Remover
                  </Button>
                ) : null}
              </li>
            ))}
          </ol>
        )}
        {questionsLocked && assignments.length > 0 ? (
          <p className="text-xs text-text-muted">
            Questões bloqueadas: avaliação publicada com atribuições ou tentativas.
          </p>
        ) : null}
      </section>

      {assessment.status !== "ARCHIVED" && !(assignments.length > 0 && assessment.status === "PUBLISHED") ? (
        <section className="space-y-3 rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-text-muted">
            Adicionar questão
          </h2>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Enunciado</span>
            <textarea
              value={stem}
              onChange={(e) => setStem(e.target.value)}
              rows={3}
              className="w-full rounded-[var(--radius-input)] border border-border bg-background px-3 py-2 text-sm"
              placeholder="Digite o enunciado da questão"
            />
          </label>
          <label className="block max-w-md space-y-1.5">
            <span className="text-sm font-semibold">Tipo</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as QuestionTypeCode)}
              className="h-10 w-full rounded-[var(--radius-input)] border border-border bg-background px-3 text-sm"
            >
              {QUESTION_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          {type !== "SHORT_TEXT" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">
                  {type === "TRUE_FALSE" ? "Verdadeiro" : "Alternativa A"}
                </span>
                <Input
                  value={type === "TRUE_FALSE" ? "Verdadeiro" : optionA}
                  disabled={type === "TRUE_FALSE"}
                  onChange={(e) => setOptionA(e.target.value)}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">
                  {type === "TRUE_FALSE" ? "Falso" : "Alternativa B"}
                </span>
                <Input
                  value={type === "TRUE_FALSE" ? "Falso" : optionB}
                  disabled={type === "TRUE_FALSE"}
                  onChange={(e) => setOptionB(e.target.value)}
                />
              </label>
              <label className="block space-y-1.5 md:col-span-2">
                <span className="text-sm font-semibold">Correta</span>
                <select
                  value={correct}
                  onChange={(e) => setCorrect(e.target.value as "A" | "B")}
                  className="h-10 max-w-xs rounded-[var(--radius-input)] border border-border bg-background px-3 text-sm"
                >
                  <option value="A">{type === "TRUE_FALSE" ? "Verdadeiro" : "Alternativa A"}</option>
                  <option value="B">{type === "TRUE_FALSE" ? "Falso" : "Alternativa B"}</option>
                </select>
              </label>
            </div>
          ) : null}

          <Button disabled={pending || stem.trim().length < 2} onClick={addQuestion}>
            Criar e vincular questão
          </Button>
        </section>
      ) : null}
    </>
  );
}
