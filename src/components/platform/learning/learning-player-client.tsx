"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { PlayerLessonDto, PlayerStateDto } from "@eduvy/contracts";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LESSON_STATUS_ICON = {
  NOT_STARTED: Circle,
  IN_PROGRESS: PlayCircle,
  COMPLETED: CheckCircle2,
} as const;

export function LearningPlayerClient({
  initialState,
}: {
  initialState: PlayerStateDto;
}) {
  const [state, setState] = useState(initialState);
  const [selectedLessonId, setSelectedLessonId] = useState(
    initialState.currentLessonId ??
      initialState.modules[0]?.lessons[0]?.id ??
      null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedLesson: PlayerLessonDto | null = useMemo(() => {
    if (!selectedLessonId) return null;
    for (const mod of state.modules) {
      const lesson = mod.lessons.find((l) => l.id === selectedLessonId);
      if (lesson) return lesson;
    }
    return null;
  }, [selectedLessonId, state.modules]);

  function selectLesson(lessonId: string) {
    setSelectedLessonId(lessonId);
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(
        `/api/learning/${state.enrollmentId}/lessons/${lessonId}/start`,
        { method: "POST" },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setMessage(body?.message ?? "Não foi possível abrir a aula.");
        return;
      }
      const next = (await response.json()) as PlayerStateDto;
      setState(next);
    });
  }

  function completeLesson() {
    if (!selectedLessonId) return;
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(
        `/api/learning/${state.enrollmentId}/lessons/${selectedLessonId}/complete`,
        { method: "POST" },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setMessage(body?.message ?? "Não foi possível concluir a aula.");
        return;
      }
      const next = (await response.json()) as PlayerStateDto;
      setState(next);
      setMessage("Aula concluída.");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background-soft">
      <header className="flex shrink-0 items-center gap-4 border-b border-border bg-surface px-4 py-3 md:px-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/learning">
            <ArrowLeft className="size-4" aria-hidden />
            Meus cursos
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-[family-name:var(--font-sora)] text-base font-bold text-text-primary md:text-lg">
            {state.courseTitle}
          </h1>
          <p className="truncate text-xs text-text-muted">{state.cohortName}</p>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <div className="w-36">
            <div className="mb-1 flex justify-between text-[11px] text-text-muted">
              <span>Progresso</span>
              <span className="font-semibold text-text-primary">
                {state.progressPercentage}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-background-soft">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${state.progressPercentage}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-text-muted">
            {state.completedLessons}/{state.totalLessons} aulas
          </span>
        </div>
        {isPending ? <Loader2 className="size-4 animate-spin text-primary" aria-hidden /> : null}
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-border bg-surface md:block lg:w-80">
          <div className="p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
              Conteúdo
            </p>
            <nav className="space-y-4">
              {state.modules.map((mod) => (
                <div key={mod.id}>
                  <p className="mb-2 text-sm font-semibold text-text-primary">{mod.title}</p>
                  <ul className="space-y-1">
                    {mod.lessons.map((lesson) => {
                      const Icon = LESSON_STATUS_ICON[lesson.progress.status];
                      const active = lesson.id === selectedLessonId;
                      return (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            onClick={() => selectLesson(lesson.id)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                              active
                                ? "bg-primary/10 font-semibold text-primary"
                                : "text-text-secondary hover:bg-background-soft",
                            )}
                          >
                            <Icon
                              className={cn(
                                "size-4 shrink-0",
                                lesson.progress.status === "COMPLETED" && "text-emerald-600",
                              )}
                              aria-hidden
                            />
                            <span className="truncate">{lesson.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          {message ? (
            <div
              role="status"
              className="mx-4 mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary md:mx-6"
            >
              {message}
            </div>
          ) : null}

          {!selectedLesson ? (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-text-muted">
              Selecione uma aula para começar.
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 md:p-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  {selectedLesson.type}
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-sora)] text-2xl font-bold text-text-primary">
                  {selectedLesson.title}
                </h2>
              </div>

              <div className="space-y-4">
                {selectedLesson.contents.length === 0 ? (
                  <p className="text-sm text-text-muted">Esta aula ainda não tem conteúdo.</p>
                ) : (
                  selectedLesson.contents.map((content) => (
                    <article
                      key={content.id}
                      className="rounded-[var(--radius-card)] border border-border bg-surface p-5"
                    >
                      {(content.type === "RICH_TEXT" || content.textContent) &&
                      content.textContent ? (
                        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-text-secondary">
                          {content.textContent}
                        </div>
                      ) : null}
                      {content.externalUrl ? (
                        <a
                          href={content.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                        >
                          Abrir recurso
                          <ExternalLink className="size-4" aria-hidden />
                        </a>
                      ) : null}
                      {!content.textContent && !content.externalUrl ? (
                        <p className="text-sm text-text-muted">
                          Conteúdo do tipo {content.type} (sem preview local).
                        </p>
                      ) : null}
                    </article>
                  ))
                )}
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-border pt-6">
                <Button
                  onClick={completeLesson}
                  disabled={
                    isPending || selectedLesson.progress.status === "COMPLETED"
                  }
                >
                  {selectedLesson.progress.status === "COMPLETED"
                    ? "Aula concluída"
                    : "Marcar como concluída"}
                </Button>
                <p className="text-xs text-text-muted md:hidden">
                  Progresso do curso: {state.progressPercentage}%
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
