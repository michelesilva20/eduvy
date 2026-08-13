"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CourseDto } from "@eduvy/contracts";
import { ArrowLeft, Archive, Copy, Layers, Pencil, Rocket } from "lucide-react";
import { PageHeader } from "@/components/platform/shared/page-header";
import { StatusBadge } from "@/components/platform/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeDate, formatWorkload } from "@/lib/courses/status";

export function CourseDetailClient({ course }: { course: CourseDto }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);

  async function runAction(
    path: string,
    successMessage: string,
    options?: { method?: string; redirectTo?: string },
  ) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch(path, { method: options?.method ?? "POST" });
        const data = (await response.json()) as CourseDto & { message?: string; id?: string };
        if (!response.ok) {
          setError(data.message ?? "Não foi possível concluir a ação.");
          return;
        }
        setMessage(successMessage);
        if (options?.redirectTo) {
          router.push(options.redirectTo.replace(":id", data.id ?? course.id));
        }
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
          href="/app/courses"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Cursos
        </Link>
      </div>

      <PageHeader
        title={course.title}
        description={course.shortDescription ?? "Gerencie o ciclo de vida e a publicação deste curso."}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={course.status} />
        {course.currentVersion ? (
          <span className="rounded-full bg-background-soft px-2.5 py-1 text-xs font-semibold text-text-muted">
            Versão {course.currentVersion.version} · {course.currentVersion.status}
          </span>
        ) : null}
        <span className="text-xs text-text-muted">
          Atualizado em {formatRelativeDate(course.updatedAt)}
        </span>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="secondary" asChild disabled={pending}>
          <Link href={`/app/courses/${course.id}/builder`}>
            <Layers className="size-4" aria-hidden />
            Editar conteúdo
          </Link>
        </Button>

        <Button variant="secondary" asChild disabled={pending}>
          <Link href={`/app/courses/${course.id}/edit`}>
            <Pencil className="size-4" aria-hidden />
            Editar
          </Link>
        </Button>

        {(course.status === "DRAFT" || course.status === "IN_REVIEW") && (
          <Button
            disabled={pending}
            onClick={() =>
              runAction(`/api/courses/${course.id}/publish`, "Curso publicado com sucesso.")
            }
          >
            <Rocket className="size-4" aria-hidden />
            Publicar
          </Button>
        )}

        <Button
          variant="secondary"
          disabled={pending}
          onClick={() =>
            runAction(`/api/courses/${course.id}/duplicate`, "Curso duplicado.", {
              redirectTo: "/app/courses/:id",
            })
          }
        >
          <Copy className="size-4" aria-hidden />
          Duplicar
        </Button>

        {course.status !== "ARCHIVED" && (
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => setConfirmArchive(true)}
          >
            <Archive className="size-4" aria-hidden />
            Arquivar
          </Button>
        )}
      </div>

      {confirmArchive ? (
        <div
          role="alertdialog"
          aria-labelledby="archive-title"
          className="mb-6 rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 p-4"
        >
          <h2 id="archive-title" className="font-semibold text-amber-900">
            Arquivar este curso?
          </h2>
          <p className="mt-1 text-sm text-amber-800">
            O curso deixará de receber novas utilizações, mas o histórico será preservado.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              disabled={pending}
              onClick={() => {
                setConfirmArchive(false);
                void runAction(
                  `/api/courses/${course.id}/archive`,
                  "Curso arquivado.",
                );
              }}
            >
              Confirmar arquivamento
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setConfirmArchive(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

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

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5">
          <h2 className="font-[family-name:var(--font-sora)] text-sm font-bold uppercase tracking-wide text-text-muted">
            Informações
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-text-muted">Categoria</dt>
              <dd className="font-medium text-text-primary">{course.category ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Carga horária</dt>
              <dd className="font-medium text-text-primary">
                {formatWorkload(course.workloadMinutes)}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Visibilidade</dt>
              <dd className="font-medium text-text-primary">{course.visibility}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Slug</dt>
              <dd className="font-medium text-text-primary">{course.slug}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Versões</dt>
              <dd className="font-medium text-text-primary">{course.versionsCount}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5">
          <h2 className="font-[family-name:var(--font-sora)] text-sm font-bold uppercase tracking-wide text-text-muted">
            Descrição
          </h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
            {course.description?.trim() ||
              "Nenhuma descrição adicionada ainda. Edite o curso para complementar esta informação."}
          </p>
        </article>
      </section>

      <section className="mt-6 rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5">
        <h2 className="font-[family-name:var(--font-sora)] text-base font-bold text-text-primary">
          Conteúdo do curso
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Estruture módulos, aulas e textos no builder. A versão{" "}
          {course.currentVersion ? `v${course.currentVersion.version}` : "inicial"} está pronta
          para receber o conteúdo.
        </p>
        <Button variant="secondary" className="mt-4" asChild>
          <Link href={`/app/courses/${course.id}/builder`}>
            <Layers className="size-4" aria-hidden />
            Abrir builder
          </Link>
        </Button>
      </section>
    </>
  );
}
