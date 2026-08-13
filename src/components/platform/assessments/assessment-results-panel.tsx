"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type {
  AssessmentQuestionStatDto,
  AssessmentResultRowDto,
  AssessmentResultRowStatusCode,
  AssessmentResultSummaryDto,
  InstructorAttemptDetailDto,
  PaginatedAssessmentResultsDto,
} from "@eduvy/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/platform/ui/badge";

const STATUS_FILTERS: Array<{
  value: "ALL" | AssessmentResultRowStatusCode | "AWAITING_GRADE";
  label: string;
}> = [
  { value: "ALL", label: "Todos" },
  { value: "GRADED", label: "Corrigidos" },
  { value: "SUBMITTED", label: "Enviados" },
  { value: "AWAITING_GRADE", label: "Aguardando correção" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "NOT_STARTED", label: "Não iniciados" },
];

const STATUS_LABEL: Record<AssessmentResultRowStatusCode, string> = {
  NOT_STARTED: "Pendente",
  IN_PROGRESS: "Em andamento",
  SUBMITTED: "Enviado",
  GRADED: "Concluído",
  EXPIRED: "Expirado",
};

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AssessmentResultsPanel({ assessmentId }: { assessmentId: string }) {
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]["value"]>("ALL");
  const [summary, setSummary] = useState<AssessmentResultSummaryDto | null>(null);
  const [items, setItems] = useState<AssessmentResultRowDto[]>([]);
  const [questionStats, setQuestionStats] = useState<AssessmentQuestionStatDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [detail, setDetail] = useState<InstructorAttemptDetailDto | null>(null);
  const [gradePoints, setGradePoints] = useState<Record<string, string>>({});

  const load = useCallback(
    (nextStatus = status, nextSearch = search) => {
      startTransition(async () => {
        setError(null);
        try {
          const params = new URLSearchParams();
          params.set("limit", "50");
          if (nextStatus !== "ALL") params.set("status", nextStatus);
          if (nextSearch.trim()) params.set("search", nextSearch.trim());

          const [resultsRes, statsRes] = await Promise.all([
            fetch(`/api/assessments/${assessmentId}/results?${params}`),
            fetch(`/api/assessments/${assessmentId}/results/questions`),
          ]);

          if (!resultsRes.ok) {
            const data = (await resultsRes.json()) as { message?: string };
            setError(data.message ?? "Não foi possível carregar os resultados.");
            return;
          }

          const data = (await resultsRes.json()) as PaginatedAssessmentResultsDto;
          setSummary(data.summary);
          setItems(data.items);
          setLoaded(true);

          if (statsRes.ok) {
            setQuestionStats((await statsRes.json()) as AssessmentQuestionStatDto[]);
          }
        } catch {
          setError("Falha de conexão ao carregar resultados.");
        }
      });
    },
    [assessmentId, search, status],
  );

  useEffect(() => {
    load();
  }, [load]);

  function openAttempt(attemptId: string) {
    startTransition(async () => {
      setError(null);
      try {
        const response = await fetch(`/api/assessment-attempts/${attemptId}/instructor`);
        const data = (await response.json()) as InstructorAttemptDetailDto & {
          message?: string;
        };
        if (!response.ok) {
          setError(data.message ?? "Não foi possível abrir a tentativa.");
          return;
        }
        setDetail(data);
        const points: Record<string, string> = {};
        for (const answer of data.answers) {
          if (answer.pendingManual) {
            points[answer.questionId] = String(answer.points);
          }
        }
        setGradePoints(points);
      } catch {
        setError("Falha de conexão ao abrir a tentativa.");
      }
    });
  }

  function grade(questionId: string, isCorrect: boolean, pointsAwarded: number) {
    if (!detail) return;
    startTransition(async () => {
      setError(null);
      try {
        const response = await fetch(
          `/api/assessment-attempts/${detail.attemptId}/answers/${questionId}/grade`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isCorrect, pointsAwarded }),
          },
        );
        const data = (await response.json()) as InstructorAttemptDetailDto & {
          message?: string;
        };
        if (!response.ok) {
          setError(data.message ?? "Não foi possível salvar a correção.");
          return;
        }
        setDetail(data);
        load();
      } catch {
        setError("Falha de conexão ao salvar a correção.");
      }
    });
  }

  return (
    <section className="mb-6 space-y-4 rounded-[var(--radius-card)] border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-text-muted">
          Resultados
        </h2>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => load()}>
          Atualizar
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Alunos" value={String(summary.studentsCount)} />
          <Stat label="Realizaram" value={String(summary.completedCount)} />
          <Stat label="Pendentes" value={String(summary.pendingCount)} />
          <Stat
            label="Média"
            value={
              summary.averagePercentage != null ? `${summary.averagePercentage}%` : "—"
            }
          />
          <Stat
            label="Maior nota"
            value={
              summary.highestPercentage != null ? `${summary.highestPercentage}%` : "—"
            }
          />
          <Stat
            label="Menor nota"
            value={
              summary.lowestPercentage != null ? `${summary.lowestPercentage}%` : "—"
            }
          />
          <Stat
            label="Aguardando correção"
            value={String(summary.awaitingGradeCount)}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <label className="block min-w-0 flex-1 space-y-1.5">
          <span className="text-sm font-semibold">Buscar aluno</span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome ou e-mail"
            onKeyDown={(e) => {
              if (e.key === "Enter") load(status, search);
            }}
          />
        </label>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => load(status, search)}
        >
          Buscar
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setStatus(item.value);
              load(item.value, search);
            }}
            className={
              status === item.value
                ? "rounded-md bg-brand-primary px-2.5 py-1 text-xs font-medium text-white"
                : "rounded-md bg-background-soft px-2.5 py-1 text-xs font-medium text-text-secondary"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {!loaded && pending ? (
        <p className="text-sm text-text-muted">Carregando resultados…</p>
      ) : null}

      {loaded && items.length === 0 ? (
        <p className="text-sm text-text-muted">
          Ainda não há resultados. Eles aparecerão assim que os alunos começarem a
          enviar esta avaliação.
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                <th className="px-2 py-2 font-semibold">Aluno</th>
                <th className="px-2 py-2 font-semibold">Turma</th>
                <th className="px-2 py-2 font-semibold">Status</th>
                <th className="px-2 py-2 font-semibold">Nota</th>
                <th className="px-2 py-2 font-semibold">Tentativa</th>
                <th className="px-2 py-2 font-semibold">Enviado</th>
                <th className="px-2 py-2 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={`${row.membershipId}-${row.assignmentId}`} className="border-b border-border/70">
                  <td className="px-2 py-2">
                    <p className="font-medium text-text-primary">{row.studentFullName}</p>
                    <p className="text-xs text-text-muted">{row.studentEmail}</p>
                  </td>
                  <td className="px-2 py-2 text-text-secondary">{row.cohortName ?? "—"}</td>
                  <td className="px-2 py-2">
                    <Badge
                      variant={
                        row.pendingManualGrade
                          ? "warning"
                          : row.status === "GRADED"
                            ? "success"
                            : row.status === "IN_PROGRESS"
                              ? "info"
                              : row.status === "NOT_STARTED"
                                ? "muted"
                                : "default"
                      }
                    >
                      {row.pendingManualGrade
                        ? "Aguardando correção"
                        : STATUS_LABEL[row.status]}
                    </Badge>
                  </td>
                  <td className="px-2 py-2 tabular-nums">
                    {row.scorePercentage != null ? `${row.scorePercentage}%` : "—"}
                  </td>
                  <td className="px-2 py-2 tabular-nums">
                    {row.attemptsUsed}
                    {row.maxAttempts != null ? `/${row.maxAttempts}` : ""}
                  </td>
                  <td className="px-2 py-2 text-text-muted">{formatWhen(row.submittedAt)}</td>
                  <td className="px-2 py-2 text-right">
                    {row.attemptId ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => openAttempt(row.attemptId!)}
                      >
                        Ver
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {questionStats.length > 0 ? (
        <div className="space-y-2 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-text-primary">Por questão</h3>
          <ul className="space-y-2">
            {questionStats.map((q, index) => (
              <li
                key={q.questionId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <p className="min-w-0 flex-1 text-text-primary">
                  {index + 1}. {q.stem}
                </p>
                <p className="text-xs text-text-muted">
                  {q.correctPercentage != null
                    ? `${q.correctPercentage}% acertaram`
                    : q.pendingManualCount > 0
                      ? `${q.pendingManualCount} aguardando correção`
                      : "Sem respostas corrigidas"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {detail ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setDetail(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-[family-name:var(--font-sora)] text-lg font-bold">
                  {detail.studentFullName}
                </h3>
                <p className="text-sm text-text-muted">
                  Tentativa #{detail.attemptNumber}
                  {detail.scorePercentage != null
                    ? ` · ${detail.scorePercentage}%`
                    : ""}
                  {detail.pendingManualGrade ? " · correção em andamento" : ""}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setDetail(null)}>
                Fechar
              </Button>
            </div>

            <ol className="space-y-3">
              {detail.answers.map((answer, index) => (
                <li
                  key={answer.questionId}
                  className="rounded-lg border border-border px-3 py-3 text-sm"
                >
                  <p className="font-medium text-text-primary">
                    Questão {index + 1}
                    {answer.pendingManual
                      ? " — Aguardando correção"
                      : answer.isCorrect === true
                        ? " — Correta"
                        : answer.isCorrect === false
                          ? " — Incorreta"
                          : ""}
                  </p>
                  <p className="mt-1 text-text-secondary">{answer.stem}</p>
                  {answer.textAnswer ? (
                    <p className="mt-2 rounded-md bg-background-soft px-3 py-2 text-text-primary">
                      {answer.textAnswer}
                    </p>
                  ) : null}
                  {answer.options ? (
                    <ul className="mt-2 space-y-1 text-xs text-text-muted">
                      {answer.options.map((option) => (
                        <li key={option.id}>
                          {answer.selectedOptionIds.includes(option.id) ? "● " : "○ "}
                          {option.text}
                          {option.isCorrect ? " (gabarito)" : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {answer.pendingManual ? (
                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <label className="space-y-1">
                        <span className="text-xs font-semibold">Pontos (0–{answer.points})</span>
                        <Input
                          type="number"
                          min={0}
                          max={answer.points}
                          className="w-24"
                          value={gradePoints[answer.questionId] ?? "0"}
                          onChange={(e) =>
                            setGradePoints((prev) => ({
                              ...prev,
                              [answer.questionId]: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          const points = Number(gradePoints[answer.questionId] ?? answer.points);
                          grade(
                            answer.questionId,
                            true,
                            Number.isFinite(points) ? points : answer.points,
                          );
                        }}
                      >
                        Marcar correta
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => grade(answer.questionId, false, 0)}
                      >
                        Marcar incorreta
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-text-muted">
                      Pontos: {answer.pointsAwarded ?? "—"} / {answer.points}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background-soft px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-sora)] text-xl font-bold text-text-primary">
        {value}
      </p>
    </div>
  );
}
