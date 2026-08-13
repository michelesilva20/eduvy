"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  BulkEnrollmentResultDto,
  CohortDto,
  CohortProgressFilterCode,
  CohortStudentProgressDto,
  EnrollmentDto,
  PaginatedCohortProgressDto,
  PaginatedEnrollmentsDto,
  PaginatedPeopleDto,
} from "@eduvy/contracts";
import {
  ArrowLeft,
  Play,
  Archive,
  CheckCircle2,
  DoorOpen,
  UserPlus,
} from "lucide-react";
import { PageHeader } from "@/components/platform/shared/page-header";
import { StatusBadge } from "@/components/platform/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "overview" | "students" | "progress" | "instructors";

const PROGRESS_FILTERS: Array<{ value: CohortProgressFilterCode; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "NOT_STARTED", label: "Não iniciados" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "COMPLETED", label: "Concluídos" },
];

const PROGRESS_STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Não iniciado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
};

function formatLastAccess(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function CohortDetailClient({ cohort }: { cohort: CohortDto }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  const [availableInstructors, setAvailableInstructors] = useState<
    Array<{ membershipId: string; fullName: string; email: string }>
  >([]);
  const [selectedInstructor, setSelectedInstructor] = useState("");

  const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);
  const [availableStudents, setAvailableStudents] = useState<
    Array<{ membershipId: string; fullName: string; email: string }>
  >([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  const [progressItems, setProgressItems] = useState<CohortStudentProgressDto[]>([]);
  const [progressCount, setProgressCount] = useState(0);
  const [progressFilter, setProgressFilter] = useState<CohortProgressFilterCode>("ALL");
  const [progressLoading, setProgressLoading] = useState(false);

  async function runAction(path: string, successMessage: string, method = "POST") {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch(path, { method });
        const data = (await response.json()) as { message?: string };
        if (!response.ok) {
          setError(data.message ?? "Não foi possível concluir a ação.");
          return;
        }
        setMessage(successMessage);
        router.refresh();
      } catch {
        setError("Falha de conexão. Tente novamente.");
      }
    });
  }

  async function loadEnrollments(): Promise<EnrollmentDto[]> {
    try {
      const response = await fetch(`/api/cohorts/${cohort.id}/enrollments?limit=100`);
      if (!response.ok) {
        setError("Não foi possível carregar matrículas.");
        return [];
      }
      const data = (await response.json()) as PaginatedEnrollmentsDto;
      setEnrollments(data.items);
      return data.items;
    } catch {
      setError("Falha ao carregar matrículas.");
      return [];
    }
  }

  async function loadStudentsPicker(currentEnrollments: EnrollmentDto[] = enrollments) {
    try {
      const response = await fetch("/api/students?status=ACTIVE&limit=50");
      if (!response.ok) {
        setError("Não foi possível carregar alunos.");
        return;
      }
      const data = (await response.json()) as PaginatedPeopleDto;
      const enrolled = new Set(
        currentEnrollments
          .filter((e) => e.status !== "CANCELLED")
          .map((e) => e.membershipId),
      );
      const available = data.items
        .filter((item) => !enrolled.has(item.membershipId))
        .map((item) => ({
          membershipId: item.membershipId,
          fullName: item.fullName,
          email: item.email,
        }));
      setAvailableStudents(available);
      setSelectedStudents(new Set());
    } catch {
      setError("Falha ao carregar alunos.");
    }
  }

  async function loadInstructorsPicker() {
    try {
      const response = await fetch("/api/instructors?status=ACTIVE&limit=50");
      if (!response.ok) {
        setError("Não foi possível carregar professores.");
        return;
      }
      const data = (await response.json()) as PaginatedPeopleDto;
      const assigned = new Set(cohort.instructors.map((i) => i.membershipId));
      const available = data.items
        .filter((item) => !assigned.has(item.membershipId))
        .map((item) => ({
          membershipId: item.membershipId,
          fullName: item.fullName,
          email: item.email,
        }));
      setAvailableInstructors(available);
      setSelectedInstructor(available[0]?.membershipId ?? "");
    } catch {
      setError("Falha ao carregar professores.");
    }
  }

  async function loadProgress(filter: CohortProgressFilterCode = progressFilter) {
    setProgressLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filter !== "ALL") params.set("filter", filter);
      const response = await fetch(`/api/cohorts/${cohort.id}/progress?${params}`);
      if (!response.ok) {
        setError("Não foi possível carregar o progresso da turma.");
        return;
      }
      const data = (await response.json()) as PaginatedCohortProgressDto;
      setProgressItems(data.items);
      setProgressCount(data.studentsCount);
    } catch {
      setError("Falha ao carregar progresso.");
    } finally {
      setProgressLoading(false);
    }
  }

  function selectTab(next: Tab) {
    setTab(next);
    if (next === "students") {
      void loadEnrollments().then((items) => {
        void loadStudentsPicker(items);
      });
    }
    if (next === "progress") {
      void loadProgress(progressFilter);
    }
    if (next === "instructors") {
      void loadInstructorsPicker();
    }
  }

  function toggleStudent(membershipId: string) {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(membershipId)) next.delete(membershipId);
      else next.add(membershipId);
      return next;
    });
  }

  function enrollSelected() {
    if (selectedStudents.size === 0) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/cohorts/${cohort.id}/enrollments/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ membershipIds: [...selectedStudents] }),
        });
        const data = (await response.json()) as BulkEnrollmentResultDto & {
          message?: string;
        };
        if (!response.ok) {
          setError(data.message ?? "Não foi possível matricular os alunos.");
          return;
        }
        setMessage(
          `${data.enrolled} matriculado(s), ${data.alreadyEnrolled} já matriculado(s), ${data.failed} falha(s).`,
        );
        const items = await loadEnrollments();
        await loadStudentsPicker(items);
        router.refresh();
      } catch {
        setError("Falha de conexão. Tente novamente.");
      }
    });
  }

  function addInstructor() {
    if (!selectedInstructor) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/cohorts/${cohort.id}/instructors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ membershipId: selectedInstructor, role: "LEAD" }),
        });
        const data = (await response.json()) as { message?: string };
        if (!response.ok) {
          setError(data.message ?? "Não foi possível atribuir o professor.");
          return;
        }
        setMessage("Professor atribuído à turma.");
        setAvailableInstructors([]);
        router.refresh();
      } catch {
        setError("Falha de conexão. Tente novamente.");
      }
    });
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href="/app/classes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Turmas
        </Link>
      </div>

      <PageHeader
        title={cohort.name}
        description={`${cohort.courseTitle} · versão ${cohort.courseVersion}`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={cohort.status} />
        {cohort.code ? (
          <span className="rounded-full bg-background-soft px-2.5 py-1 text-xs font-semibold text-text-muted">
            {cohort.code}
          </span>
        ) : null}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {cohort.status === "DRAFT" ? (
          <Button
            disabled={pending}
            onClick={() =>
              runAction(`/api/cohorts/${cohort.id}/open`, "Turma aberta para matrículas.")
            }
          >
            <DoorOpen className="size-4" aria-hidden />
            Abrir
          </Button>
        ) : null}
        {cohort.status === "OPEN" || cohort.status === "DRAFT" ? (
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => runAction(`/api/cohorts/${cohort.id}/start`, "Turma iniciada.")}
          >
            <Play className="size-4" aria-hidden />
            Iniciar
          </Button>
        ) : null}
        {cohort.status === "IN_PROGRESS" || cohort.status === "OPEN" ? (
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() =>
              runAction(`/api/cohorts/${cohort.id}/complete`, "Turma concluída.")
            }
          >
            <CheckCircle2 className="size-4" aria-hidden />
            Concluir
          </Button>
        ) : null}
        {cohort.status !== "ARCHIVED" ? (
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() =>
              runAction(`/api/cohorts/${cohort.id}/archive`, "Turma arquivada.")
            }
          >
            <Archive className="size-4" aria-hidden />
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

      <div className="mb-4 flex gap-2 border-b border-border-light">
        {(
          [
            ["overview", "Visão geral"],
            ["students", "Alunos"],
            ["progress", "Progresso"],
            ["instructors", "Professores"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => selectTab(key)}
            className={
              tab === key
                ? "border-b-2 border-primary px-3 py-2 text-sm font-semibold text-primary"
                : "px-3 py-2 text-sm text-text-muted hover:text-text-primary"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-text-muted">Resumo</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-text-muted">Alunos matriculados</dt>
                <dd className="font-medium">{cohort.studentsCount}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Professores</dt>
                <dd className="font-medium">{cohort.instructorsCount}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Limite</dt>
                <dd className="font-medium">{cohort.maxStudents ?? "Sem limite"}</dd>
              </div>
            </dl>
          </article>
          <article className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-text-muted">Curso</h2>
            <p className="mt-4 font-medium text-text-primary">{cohort.courseTitle}</p>
            <p className="mt-1 text-sm text-text-muted">Versão {cohort.courseVersion}</p>
            <Button variant="secondary" className="mt-4" asChild>
              <Link href={`/app/courses/${cohort.courseId}`}>Ver curso</Link>
            </Button>
          </article>
        </section>
      ) : null}

      {tab === "students" ? (
        <section className="space-y-4">
          <div className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
              Matriculados
            </h2>
            {enrollments.length === 0 ? (
              <p className="text-sm text-text-muted">Nenhum aluno matriculado ainda.</p>
            ) : (
              <ul className="space-y-2">
                {enrollments.map((enrollment) => (
                  <li
                    key={enrollment.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-light px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{enrollment.studentFullName}</p>
                      <p className="text-xs text-text-muted">
                        {enrollment.studentEmail} · {enrollment.status}
                      </p>
                    </div>
                    {enrollment.status !== "CANCELLED" &&
                    enrollment.status !== "COMPLETED" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        className="text-red-600"
                        onClick={() =>
                          runAction(
                            `/api/enrollments/${enrollment.id}/cancel`,
                            "Matrícula cancelada.",
                          )
                        }
                      >
                        Cancelar
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Matricular alunos</h3>
              <Button
                size="sm"
                disabled={pending || selectedStudents.size === 0}
                onClick={enrollSelected}
              >
                Matricular {selectedStudents.size > 0 ? `(${selectedStudents.size})` : ""}
              </Button>
            </div>

            {availableStudents.length === 0 ? (
              <p className="text-sm text-text-muted">
                Nenhum aluno disponível para matrícula. Convide alunos em{" "}
                <Link href="/app/students" className="text-primary hover:underline">
                  Alunos
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-2">
                {availableStudents.map((student) => (
                  <li key={student.membershipId}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border-light px-3 py-2 text-sm hover:bg-background-soft/50">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.membershipId)}
                        onChange={() => toggleStudent(student.membershipId)}
                      />
                      <span>
                        <span className="block font-medium">{student.fullName}</span>
                        <span className="block text-xs text-text-muted">{student.email}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {tab === "progress" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-muted">
              <span className="font-semibold text-text-primary">{progressCount}</span>{" "}
              {progressCount === 1 ? "aluno" : "alunos"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PROGRESS_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setProgressFilter(item.value);
                    void loadProgress(item.value);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    progressFilter === item.value
                      ? "bg-primary text-white"
                      : "bg-background-soft text-text-muted hover:text-text-primary",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border-light bg-surface-light">
            {progressLoading ? (
              <p className="px-4 py-8 text-sm text-text-muted">Carregando progresso…</p>
            ) : progressItems.length === 0 ? (
              <p className="px-4 py-8 text-sm text-text-muted">
                Nenhum aluno neste filtro. Matricule alunos na aba Alunos.
              </p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border-light bg-background-soft/60 text-xs uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nome</th>
                    <th className="px-4 py-3 font-semibold">Progresso</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Último acesso</th>
                  </tr>
                </thead>
                <tbody>
                  {progressItems.map((item) => (
                    <tr key={item.enrollmentId} className="border-b border-border-light last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-primary">{item.studentFullName}</p>
                        <p className="text-xs text-text-muted">{item.studentEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-[140px]">
                          <div className="mb-1 flex justify-between text-xs text-text-muted">
                            <span>
                              {item.completedLessons}/{item.totalLessons} aulas
                            </span>
                            <span className="font-semibold text-text-primary">
                              {item.progressPercentage}%
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-background-soft">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${item.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                            item.progressStatus === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700"
                              : item.progressStatus === "IN_PROGRESS"
                                ? "bg-primary/10 text-primary"
                                : "bg-background-soft text-text-muted",
                          )}
                        >
                          {PROGRESS_STATUS_LABEL[item.progressStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {formatLastAccess(item.lastAccessAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      ) : null}

      {tab === "instructors" ? (
        <section className="space-y-4">
          <div className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-text-muted">
                Professores da turma
              </h2>
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => void loadInstructorsPicker()}
              >
                <UserPlus className="size-4" aria-hidden />
                Atualizar lista
              </Button>
            </div>

            {cohort.instructors.length === 0 ? (
              <p className="text-sm text-text-muted">Nenhum professor atribuído ainda.</p>
            ) : (
              <ul className="space-y-2">
                {cohort.instructors.map((instructor) => (
                  <li
                    key={instructor.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-light px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{instructor.fullName}</p>
                      <p className="text-xs text-text-muted">
                        {instructor.email} · {instructor.role}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      className="text-red-600"
                      onClick={() =>
                        runAction(
                          `/api/cohorts/${cohort.id}/instructors/${instructor.membershipId}`,
                          "Professor removido.",
                          "DELETE",
                        )
                      }
                    >
                      Remover
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {availableInstructors.length > 0 ? (
            <div className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5">
              <h3 className="mb-3 text-sm font-semibold">Atribuir professor</h3>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={selectedInstructor}
                  onChange={(e) => setSelectedInstructor(e.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-[var(--radius-input)] border border-border-light bg-background px-3 text-sm"
                >
                  {availableInstructors.map((item) => (
                    <option key={item.membershipId} value={item.membershipId}>
                      {item.fullName} ({item.email})
                    </option>
                  ))}
                </select>
                <Button disabled={pending || !selectedInstructor} onClick={addInstructor}>
                  Atribuir
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
