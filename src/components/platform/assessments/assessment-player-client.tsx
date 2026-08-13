"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type {
  AssessmentAttemptDto,
  StudentAttemptResultDto,
  StudentQuestionDto,
} from "@eduvy/contracts";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SaveState = "idle" | "saving" | "saved" | "error";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function isAnswered(
  question: StudentQuestionDto,
  answers: AssessmentAttemptDto["answers"],
): boolean {
  const answer = answers.find((a) => a.questionId === question.id);
  if (!answer) return false;
  if (question.type === "SHORT_TEXT") {
    return Boolean(answer.textAnswer?.trim());
  }
  return (answer.selectedOptionIds?.length ?? 0) > 0;
}

export function AssessmentPlayerClient({
  initialAttempt,
}: {
  initialAttempt: AssessmentAttemptDto;
}) {
  const [attempt, setAttempt] = useState(initialAttempt);
  const [index, setIndex] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [result, setResult] = useState<StudentAttemptResultDto | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(() => {
    if (!initialAttempt.expiresAt) return null;
    const serverNow = new Date(initialAttempt.serverNow).getTime();
    return new Date(initialAttempt.expiresAt).getTime() - serverNow;
  });
  const [isPending, startTransition] = useTransition();
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const offsetRef = useRef(0);

  const question = attempt.questions[index] ?? null;
  const answeredCount = useMemo(
    () => attempt.questions.filter((q) => isAnswered(q, attempt.answers)).length,
    [attempt],
  );
  const unanswered = useMemo(
    () => attempt.questions.filter((q) => !isAnswered(q, attempt.answers)),
    [attempt],
  );

  useEffect(() => {
    const serverNow = new Date(attempt.serverNow).getTime();
    offsetRef.current = serverNow - Date.now();
  }, [attempt.serverNow]);

  useEffect(() => {
    if (!attempt.expiresAt || attempt.status !== "IN_PROGRESS") {
      return;
    }
    let expiredHandled = false;
    const tick = () => {
      const now = Date.now() + offsetRef.current;
      const left = new Date(attempt.expiresAt!).getTime() - now;
      setRemainingMs(left);
      if (left <= 0 && !expiredHandled) {
        expiredHandled = true;
        startTransition(async () => {
          const response = await fetch(
            `/api/assessment-attempts/${attempt.id}/submit`,
            { method: "POST" },
          );
          if (response.ok) {
            const body = (await response.json()) as StudentAttemptResultDto;
            setResult(body);
            setAttempt((prev) => ({ ...prev, status: body.status }));
          }
        });
      }
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [attempt.expiresAt, attempt.id, attempt.status]);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (saveState === "saving" && attempt.status === "IN_PROGRESS") {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [saveState, attempt.status]);

  function currentAnswer(questionId: string) {
    return (
      attempt.answers.find((a) => a.questionId === questionId) ?? {
        questionId,
        selectedOptionIds: [] as string[],
        textAnswer: null as string | null,
        answeredAt: null as string | null,
      }
    );
  }

  function scheduleSave(
    questionId: string,
    payload: { selectedOptionIds?: string[]; textAnswer?: string | null },
  ) {
    const existing = saveTimers.current.get(questionId);
    if (existing) clearTimeout(existing);
    setSaveState("saving");
    const timer = setTimeout(() => {
      startTransition(async () => {
        const response = await fetch(
          `/api/assessment-attempts/${attempt.id}/answers/${questionId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            message?: string;
          } | null;
          setSaveState("error");
          setMessage(body?.message ?? "Erro ao salvar resposta.");
          return;
        }
        const next = (await response.json()) as AssessmentAttemptDto;
        setAttempt(next);
        setSaveState("saved");
        setMessage(null);
      });
    }, 350);
    saveTimers.current.set(questionId, timer);
  }

  function selectSingle(optionId: string) {
    if (!question || attempt.status !== "IN_PROGRESS") return;
    const payload = { selectedOptionIds: [optionId], textAnswer: null };
    setAttempt((prev) => ({
      ...prev,
      answers: [
        ...prev.answers.filter((a) => a.questionId !== question.id),
        {
          questionId: question.id,
          selectedOptionIds: [optionId],
          textAnswer: null,
          answeredAt: new Date().toISOString(),
        },
      ],
    }));
    scheduleSave(question.id, payload);
  }

  function toggleMulti(optionId: string) {
    if (!question || attempt.status !== "IN_PROGRESS") return;
    const current = currentAnswer(question.id).selectedOptionIds ?? [];
    const nextIds = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    const payload = { selectedOptionIds: nextIds, textAnswer: null };
    setAttempt((prev) => ({
      ...prev,
      answers: [
        ...prev.answers.filter((a) => a.questionId !== question.id),
        {
          questionId: question.id,
          selectedOptionIds: nextIds,
          textAnswer: null,
          answeredAt: new Date().toISOString(),
        },
      ],
    }));
    scheduleSave(question.id, payload);
  }

  function updateText(value: string) {
    if (!question || attempt.status !== "IN_PROGRESS") return;
    const payload = { selectedOptionIds: [], textAnswer: value };
    setAttempt((prev) => ({
      ...prev,
      answers: [
        ...prev.answers.filter((a) => a.questionId !== question.id),
        {
          questionId: question.id,
          selectedOptionIds: [],
          textAnswer: value,
          answeredAt: new Date().toISOString(),
        },
      ],
    }));
    scheduleSave(question.id, payload);
  }

  function submitAttempt() {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/assessment-attempts/${attempt.id}/submit`, {
        method: "POST",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setMessage(body?.message ?? "Não foi possível enviar a avaliação.");
        setConfirmSubmit(false);
        return;
      }
      const body = (await response.json()) as StudentAttemptResultDto;
      setResult(body);
      setConfirmSubmit(false);
    });
  }

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background-soft px-4">
        <div className="w-full max-w-lg rounded-[var(--radius-card)] border border-border bg-surface p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-text-muted">Avaliação concluída</p>
          <h1 className="mt-2 font-[family-name:var(--font-sora)] text-2xl font-bold text-text-primary">
            {result.assessmentTitle}
          </h1>
          {result.pendingManualGrade ? (
            <p className="mt-6 text-base text-text-secondary">
              Correção em andamento — há questões de resposta aberta.
            </p>
          ) : (
            <>
              <p className="mt-8 font-[family-name:var(--font-sora)] text-4xl font-bold text-text-primary">
                {result.score ?? 0}
                <span className="text-xl text-text-muted"> / {result.maxScore ?? 0}</span>
              </p>
              <p className="mt-2 text-sm text-text-muted">
                Aproveitamento {result.scorePercentage ?? 0}%
              </p>
            </>
          )}
          <p className="mt-4 text-sm text-text-muted">
            Tentativa {result.attemptNumber}
            {result.maxAttempts != null ? ` de ${result.maxAttempts}` : ""}
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/app/my-assessments">Voltar às avaliações</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app/learning">Meus cursos</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-soft">
        <p className="text-sm text-text-muted">Nenhuma questão nesta avaliação.</p>
      </div>
    );
  }

  const answer = currentAnswer(question.id);
  const progress = attempt.questionsCount
    ? Math.round((answeredCount / attempt.questionsCount) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background-soft">
      <header className="flex shrink-0 flex-col gap-3 border-b border-border bg-surface px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/app/my-assessments">
              <ArrowLeft className="size-4" aria-hidden />
              Sair
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-[family-name:var(--font-sora)] text-base font-bold text-text-primary md:text-lg">
              {attempt.assessmentTitle}
            </h1>
            <p className="text-xs text-text-muted">
              Questão {index + 1}/{attempt.questionsCount}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            {saveState === "saving" && (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Salvando…
              </span>
            )}
            {saveState === "saved" && (
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <Check className="size-3.5" aria-hidden />
                Salvo
              </span>
            )}
            {saveState === "error" && (
              <span className="text-red-600">Erro ao salvar</span>
            )}
            {remainingMs != null && (
              <span
                className={cn(
                  "rounded-md px-2 py-1 font-medium tabular-nums",
                  remainingMs < 60_000
                    ? "bg-red-50 text-red-700"
                    : "bg-background-soft text-text-secondary",
                )}
                aria-live="polite"
              >
                {formatRemaining(remainingMs)}
              </span>
            )}
          </div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
          <div
            className="h-full rounded-full bg-brand-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="order-2 border-t border-border bg-surface p-3 md:order-1 md:w-56 md:border-r md:border-t-0 md:p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
            Questões
          </p>
          <div className="flex flex-wrap gap-2 md:flex-col">
            {attempt.questions.map((q, i) => {
              const done = isAnswered(q, attempt.answers);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-md text-sm font-medium transition-colors md:w-full md:justify-start md:gap-2 md:px-3",
                    i === index
                      ? "bg-brand-primary text-white"
                      : done
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-background-soft text-text-secondary hover:bg-border/40",
                  )}
                  aria-current={i === index ? "step" : undefined}
                  aria-label={`Questão ${i + 1}${done ? ", respondida" : ""}`}
                >
                  <span>{i + 1}</span>
                  {done && <Check className="hidden size-3.5 md:inline" aria-hidden />}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="order-1 min-h-0 flex-1 overflow-y-auto px-4 py-6 md:order-2 md:px-10">
          <p className="text-sm font-medium text-text-muted">Questão {index + 1}</p>
          <h2 className="mt-2 max-w-3xl font-[family-name:var(--font-sora)] text-xl font-semibold leading-relaxed text-text-primary md:text-2xl">
            {question.stem}
          </h2>

          <div className="mt-8 max-w-2xl space-y-3">
            {(question.type === "SINGLE_CHOICE" || question.type === "TRUE_FALSE") &&
              question.options?.map((option) => {
                const checked = answer.selectedOptionIds.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border px-4 py-3 transition-colors",
                      checked
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-border bg-surface hover:border-brand-primary/40",
                    )}
                  >
                    <input
                      type="radio"
                      className="mt-1 size-4"
                      name={`q-${question.id}`}
                      checked={checked}
                      disabled={attempt.status !== "IN_PROGRESS" || isPending}
                      onChange={() => selectSingle(option.id)}
                    />
                    <span className="text-sm text-text-primary">{option.text}</span>
                  </label>
                );
              })}

            {question.type === "MULTIPLE_CHOICE" &&
              question.options?.map((option) => {
                const checked = answer.selectedOptionIds.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border px-4 py-3 transition-colors",
                      checked
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-border bg-surface hover:border-brand-primary/40",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 size-4"
                      checked={checked}
                      disabled={attempt.status !== "IN_PROGRESS" || isPending}
                      onChange={() => toggleMulti(option.id)}
                    />
                    <span className="text-sm text-text-primary">{option.text}</span>
                  </label>
                );
              })}

            {question.type === "SHORT_TEXT" && (
              <textarea
                className="min-h-32 w-full rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                value={answer.textAnswer ?? ""}
                disabled={attempt.status !== "IN_PROGRESS" || isPending}
                onChange={(event) => updateText(event.target.value)}
                placeholder="Digite sua resposta"
                aria-label="Resposta em texto"
              />
            )}
          </div>

          {message && (
            <p role="alert" className="mt-6 text-sm text-red-600">
              {message}
            </p>
          )}
        </main>
      </div>

      <footer className="flex shrink-0 flex-col gap-3 border-t border-border bg-surface px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="text-sm text-text-muted">
          {answeredCount} de {attempt.questionsCount} respondidas
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={index === 0}
            onClick={() => setIndex((value) => Math.max(0, value - 1))}
          >
            Anterior
          </Button>
          {index < attempt.questions.length - 1 ? (
            <Button onClick={() => setIndex((value) => value + 1)}>Próxima</Button>
          ) : (
            <Button
              onClick={() => setConfirmSubmit(true)}
              disabled={attempt.status !== "IN_PROGRESS"}
            >
              Enviar avaliação
            </Button>
          )}
        </div>
      </footer>

      {confirmSubmit && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-title"
        >
          <div className="w-full max-w-md rounded-[var(--radius-card)] bg-surface p-6 shadow-lg">
            <h2
              id="submit-title"
              className="font-[family-name:var(--font-sora)] text-lg font-bold text-text-primary"
            >
              Enviar avaliação?
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Você respondeu {answeredCount} de {attempt.questionsCount} questões.
              {unanswered.length > 0
                ? ` ${unanswered.length} ainda sem resposta.`
                : ""}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              {unanswered.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const first = attempt.questions.findIndex((q) =>
                      unanswered.some((u) => u.id === q.id),
                    );
                    if (first >= 0) setIndex(first);
                    setConfirmSubmit(false);
                  }}
                >
                  Revisar respostas
                </Button>
              )}
              <Button variant="ghost" onClick={() => setConfirmSubmit(false)}>
                Cancelar
              </Button>
              <Button onClick={submitAttempt} disabled={isPending}>
                {isPending ? "Enviando…" : "Enviar mesmo assim"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
