"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type {
  CourseDto,
  CourseModuleDto,
  CourseStructureDto,
  LessonDto,
} from "@eduvy/contracts";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import type { LessonTypeCode } from "@eduvy/contracts";
import { PageHeader } from "@/components/platform/shared/page-header";
import { StatusBadge } from "@/components/platform/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SaveState = "idle" | "saving" | "saved" | "error";

const LESSON_TYPE_OPTIONS: { value: LessonTypeCode; label: string }[] = [
  { value: "TEXT", label: "Texto" },
  { value: "VIDEO", label: "Vídeo (URL)" },
  { value: "LINK", label: "Link externo" },
  { value: "DOCUMENT", label: "Documento (URL)" },
];

type DragItem =
  | { kind: "module"; id: string }
  | { kind: "lesson"; id: string; moduleId: string };

function findLesson(structure: CourseStructureDto, lessonId: string | null): {
  lesson: LessonDto | null;
  moduleId: string | null;
} {
  if (!lessonId) return { lesson: null, moduleId: null };
  for (const mod of structure.modules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) return { lesson, moduleId: mod.id };
  }
  return { lesson: null, moduleId: null };
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message ?? "Não foi possível concluir a operação.";
  } catch {
    return "Não foi possível concluir a operação.";
  }
}

function draftFromLesson(lesson: LessonDto | null): {
  title: string;
  text: string;
  type: LessonTypeCode;
  externalUrl: string;
} {
  if (!lesson) {
    return { title: "", text: "", type: "TEXT", externalUrl: "" };
  }
  const primary = lesson.contents[0] ?? null;
  return {
    title: lesson.title,
    text: primary?.textContent ?? "",
    type: lesson.type,
    externalUrl: primary?.externalUrl ?? "",
  };
}

export function CourseBuilderClient({
  course,
  initialStructure,
}: {
  course: CourseDto;
  initialStructure: CourseStructureDto;
}) {
  const [structure, setStructure] = useState(initialStructure);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(() => {
    const first = initialStructure.modules[0]?.lessons[0];
    return first?.id ?? null;
  });
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    () => new Set(initialStructure.modules.map((m) => m.id)),
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [contentSave, setContentSave] = useState<SaveState>("idle");
  const [lessonDraft, setLessonDraft] = useState(() => {
    const first = initialStructure.modules[0]?.lessons[0] ?? null;
    return draftFromLesson(first);
  });
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<{ kind: "module" | "lesson"; id: string } | null>(
    null,
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { lesson: selectedLesson, moduleId: selectedModuleId } = useMemo(
    () => findLesson(structure, selectedLessonId),
    [structure, selectedLessonId],
  );

  const primaryContent = selectedLesson?.contents[0] ?? null;

  function selectLesson(lessonId: string | null) {
    setSelectedLessonId(lessonId);
    const { lesson } = findLesson(structure, lessonId);
    setLessonDraft(draftFromLesson(lesson));
    setContentSave("idle");
  }

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  function runMutation(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch {
        setError("Falha de conexão. Tente novamente.");
      }
    });
  }

  function addModule() {
    if (!structure.editable) return;
    runMutation(async () => {
      const response = await fetch(`/api/courses/${course.id}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Módulo ${structure.modules.length + 1}` }),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      const data = (await response.json()) as CourseStructureDto;
      setStructure(data);
      const created = data.modules[data.modules.length - 1];
      if (created) {
        setExpandedModules((prev) => new Set(prev).add(created.id));
      }
    });
  }

  function addLesson(moduleId: string) {
    if (!structure.editable) return;
    const mod = structure.modules.find((m) => m.id === moduleId);
    runMutation(async () => {
      const response = await fetch(`/api/courses/${course.id}/modules/${moduleId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Aula ${(mod?.lessons.length ?? 0) + 1}`,
          type: "TEXT",
        }),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      const data = (await response.json()) as CourseStructureDto;
      setStructure(data);
      const updatedMod = data.modules.find((m) => m.id === moduleId);
      const created = updatedMod?.lessons[updatedMod.lessons.length - 1];
      if (created) {
        setSelectedLessonId(created.id);
        setLessonDraft(draftFromLesson(created));
        setContentSave("idle");
      }
      setExpandedModules((prev) => new Set(prev).add(moduleId));
    });
  }

  function deleteModule(moduleId: string) {
    if (!structure.editable || !window.confirm("Excluir este módulo e todas as aulas?")) return;
    runMutation(async () => {
      const response = await fetch(`/api/courses/${course.id}/modules/${moduleId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      const data = (await response.json()) as CourseStructureDto;
      setStructure(data);
      if (selectedModuleId === moduleId) {
        setSelectedLessonId(null);
        setLessonDraft(draftFromLesson(null));
        setContentSave("idle");
      }
    });
  }

  function deleteLesson(lessonId: string) {
    if (!structure.editable || !window.confirm("Excluir esta aula?")) return;
    runMutation(async () => {
      const response = await fetch(`/api/courses/${course.id}/lessons/${lessonId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      const data = (await response.json()) as CourseStructureDto;
      setStructure(data);
      if (selectedLessonId === lessonId) {
        setSelectedLessonId(null);
        setLessonDraft(draftFromLesson(null));
        setContentSave("idle");
      }
    });
  }

  function moveModule(moduleId: string, direction: "up" | "down") {
    if (!structure.editable) return;
    const ids = structure.modules.map((m) => m.id);
    const index = ids.indexOf(moduleId);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= ids.length) return;
    [ids[index], ids[swapWith]] = [ids[swapWith], ids[index]];

    runMutation(async () => {
      const response = await fetch(`/api/courses/${course.id}/modules/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: ids }),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      setStructure((await response.json()) as CourseStructureDto);
    });
  }

  function moveLesson(moduleId: string, lessonId: string, direction: "up" | "down") {
    if (!structure.editable) return;
    const mod = structure.modules.find((m) => m.id === moduleId);
    if (!mod) return;
    const ids = mod.lessons.map((l) => l.id);
    const index = ids.indexOf(lessonId);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= ids.length) return;
    [ids[index], ids[swapWith]] = [ids[swapWith], ids[index]];

    runMutation(async () => {
      const response = await fetch(
        `/api/courses/${course.id}/modules/${moduleId}/lessons/reorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds: ids }),
        },
      );
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      setStructure((await response.json()) as CourseStructureDto);
    });
  }

  function scheduleLessonTitleSave(title: string) {
    if (!structure.editable || !selectedLessonId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetch(`/api/courses/${course.id}/lessons/${selectedLessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }).then(async (response) => {
        if (!response.ok) {
          setError(await readError(response));
          return;
        }
        const updated = (await response.json()) as LessonDto;
        setStructure((prev) => ({
          ...prev,
          modules: prev.modules.map((mod) => ({
            ...mod,
            lessons: mod.lessons.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)),
          })),
        }));
      });
    }, 500);
  }

  function scheduleContentSave(text: string) {
    if (!structure.editable || !selectedLessonId || !primaryContent) return;
    setContentSave("saving");
    if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current);
    contentDebounceRef.current = setTimeout(() => {
      void fetch(
        `/api/courses/${course.id}/lessons/${selectedLessonId}/contents/${primaryContent.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ textContent: text }),
        },
      ).then(async (response) => {
        if (!response.ok) {
          setContentSave("error");
          setError(await readError(response));
          return;
        }
        setContentSave("saved");
        setTimeout(() => setContentSave("idle"), 2000);
      });
    }, 700);
  }

  function scheduleLessonTypeSave(type: LessonTypeCode) {
    if (!structure.editable || !selectedLessonId || !primaryContent) return;
    setContentSave("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const contentType =
        type === "TEXT" ? "RICH_TEXT" : type === "VIDEO" ? "VIDEO" : "LINK";
      void Promise.all([
        fetch(`/api/courses/${course.id}/lessons/${selectedLessonId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        }),
        fetch(
          `/api/courses/${course.id}/lessons/${selectedLessonId}/contents/${primaryContent.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: contentType }),
          },
        ),
      ]).then(async ([lessonRes, contentRes]) => {
        if (!lessonRes.ok || !contentRes.ok) {
          setContentSave("error");
          setError(await readError(!lessonRes.ok ? lessonRes : contentRes));
          return;
        }
        setContentSave("saved");
        setTimeout(() => setContentSave("idle"), 2000);
      });
    }, 400);
  }

  function scheduleExternalUrlSave(externalUrl: string) {
    if (!structure.editable || !selectedLessonId || !primaryContent) return;
    setContentSave("saving");
    if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current);
    contentDebounceRef.current = setTimeout(() => {
      void fetch(
        `/api/courses/${course.id}/lessons/${selectedLessonId}/contents/${primaryContent.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ externalUrl: externalUrl || null }),
        },
      ).then(async (response) => {
        if (!response.ok) {
          setContentSave("error");
          setError(await readError(response));
          return;
        }
        setContentSave("saved");
        setTimeout(() => setContentSave("idle"), 2000);
      });
    }, 700);
  }

  function reorderModulesByDrop(targetModuleId: string) {
    if (!structure.editable || !dragItem || dragItem.kind !== "module") return;
    if (dragItem.id === targetModuleId) return;
    const ids = structure.modules.map((m) => m.id);
    const from = ids.indexOf(dragItem.id);
    const to = ids.indexOf(targetModuleId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, dragItem.id);
    runMutation(async () => {
      const response = await fetch(`/api/courses/${course.id}/modules/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: ids }),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      setStructure((await response.json()) as CourseStructureDto);
    });
  }

  function reorderLessonsByDrop(moduleId: string, targetLessonId: string) {
    if (!structure.editable || !dragItem || dragItem.kind !== "lesson") return;
    if (dragItem.moduleId !== moduleId || dragItem.id === targetLessonId) return;
    const mod = structure.modules.find((m) => m.id === moduleId);
    if (!mod) return;
    const ids = mod.lessons.map((l) => l.id);
    const from = ids.indexOf(dragItem.id);
    const to = ids.indexOf(targetLessonId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, dragItem.id);
    runMutation(async () => {
      const response = await fetch(
        `/api/courses/${course.id}/modules/${moduleId}/lessons/reorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds: ids }),
        },
      );
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      setStructure((await response.json()) as CourseStructureDto);
    });
  }

  function updateModuleTitle(module: CourseModuleDto, title: string) {
    if (!structure.editable) return;
    setStructure((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => (m.id === module.id ? { ...m, title } : m)),
    }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetch(`/api/courses/${course.id}/modules/${module.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
    }, 500);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/app/courses/${course.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar ao curso
        </Link>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
          Versão {structure.version} · {structure.versionStatus}
          {!structure.editable ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
              Somente leitura
            </span>
          ) : null}
        </div>
      </div>

      <PageHeader
        title={`Builder · ${course.title}`}
        description="Organize módulos, aulas e conteúdo textual. Alterações são salvas automaticamente."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={course.status} />
        {structure.editable ? (
          <Button size="sm" onClick={addModule} disabled={pending}>
            <Plus className="size-4" aria-hidden />
            Novo módulo
          </Button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <aside className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-3">
          <h2 className="mb-3 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-text-muted">
            <BookOpen className="size-3.5" aria-hidden />
            Estrutura
          </h2>

          {structure.modules.length === 0 ? (
            <p className="px-1 text-sm text-text-muted">
              Nenhum módulo ainda.{" "}
              {structure.editable ? "Clique em “Novo módulo” para começar." : ""}
            </p>
          ) : (
            <ul className="space-y-2">
              {structure.modules.map((mod, modIndex) => (
                <li
                  key={mod.id}
                  draggable={structure.editable}
                  onDragStart={() => setDragItem({ kind: "module", id: mod.id })}
                  onDragEnd={() => {
                    setDragItem(null);
                    setDropTarget(null);
                  }}
                  onDragOver={(event) => {
                    if (!structure.editable || dragItem?.kind !== "module") return;
                    event.preventDefault();
                    setDropTarget({ kind: "module", id: mod.id });
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    reorderModulesByDrop(mod.id);
                    setDragItem(null);
                    setDropTarget(null);
                  }}
                  className={cn(
                    "rounded-lg border border-border-light bg-background-soft/50 transition-colors",
                    dropTarget?.kind === "module" && dropTarget.id === mod.id
                      ? "border-primary/40 bg-primary/5"
                      : "",
                  )}
                >
                  <div className="flex items-start gap-1 p-2">
                    {structure.editable ? (
                      <span
                        className="mt-1 cursor-grab text-text-muted active:cursor-grabbing"
                        aria-hidden
                      >
                        <GripVertical className="size-4" />
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => toggleModule(mod.id)}
                    >
                      {structure.editable ? (
                        <Input
                          value={mod.title}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateModuleTitle(mod, e.target.value)}
                          className="h-8 border-transparent bg-transparent px-1 font-medium shadow-none focus-visible:border-border-light"
                        />
                      ) : (
                        <span className="block px-1 py-1 text-sm font-medium">{mod.title}</span>
                      )}
                      <span className="block px-1 text-xs text-text-muted">
                        {mod.lessons.length} aula{mod.lessons.length === 1 ? "" : "s"}
                      </span>
                    </button>
                    {structure.editable ? (
                      <div className="flex shrink-0 flex-col gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={pending || modIndex === 0}
                          onClick={() => moveModule(mod.id, "up")}
                          aria-label="Mover módulo para cima"
                        >
                          <ArrowUp className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={pending || modIndex === structure.modules.length - 1}
                          onClick={() => moveModule(mod.id, "down")}
                          aria-label="Mover módulo para baixo"
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-red-600 hover:text-red-700"
                          disabled={pending}
                          onClick={() => deleteModule(mod.id)}
                          aria-label="Excluir módulo"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  {expandedModules.has(mod.id) ? (
                    <ul className="border-t border-border-light px-2 pb-2 pt-1">
                      {mod.lessons.map((lesson, lessonIndex) => (
                        <li
                          key={lesson.id}
                          draggable={structure.editable}
                          onDragStart={(event) => {
                            event.stopPropagation();
                            setDragItem({ kind: "lesson", id: lesson.id, moduleId: mod.id });
                          }}
                          onDragEnd={() => {
                            setDragItem(null);
                            setDropTarget(null);
                          }}
                          onDragOver={(event) => {
                            if (!structure.editable || dragItem?.kind !== "lesson") return;
                            if (dragItem.moduleId !== mod.id) return;
                            event.preventDefault();
                            event.stopPropagation();
                            setDropTarget({ kind: "lesson", id: lesson.id });
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            reorderLessonsByDrop(mod.id, lesson.id);
                            setDragItem(null);
                            setDropTarget(null);
                          }}
                          className={cn(
                            "flex items-center gap-1 rounded-md transition-colors",
                            dropTarget?.kind === "lesson" && dropTarget.id === lesson.id
                              ? "bg-primary/5"
                              : "",
                          )}
                        >
                          {structure.editable ? (
                            <span
                              className="cursor-grab text-text-muted active:cursor-grabbing"
                              aria-hidden
                            >
                              <GripVertical className="size-3.5" />
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => selectLesson(lesson.id)}
                            className={cn(
                              "min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                              selectedLessonId === lesson.id
                                ? "bg-primary/10 font-medium text-primary"
                                : "text-text-secondary hover:bg-background-soft",
                            )}
                          >
                            {lesson.title}
                          </button>
                          {structure.editable ? (
                            <div className="flex shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                disabled={pending || lessonIndex === 0}
                                onClick={() => moveLesson(mod.id, lesson.id, "up")}
                                aria-label="Mover aula para cima"
                              >
                                <ArrowUp className="size-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                disabled={pending || lessonIndex === mod.lessons.length - 1}
                                onClick={() => moveLesson(mod.id, lesson.id, "down")}
                                aria-label="Mover aula para baixo"
                              >
                                <ArrowDown className="size-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 text-red-600"
                                disabled={pending}
                                onClick={() => deleteLesson(lesson.id)}
                                aria-label="Excluir aula"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          ) : null}
                        </li>
                      ))}
                      {structure.editable ? (
                        <li className="pt-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-full justify-start text-xs"
                            disabled={pending}
                            onClick={() => addLesson(mod.id)}
                          >
                            <Plus className="size-3.5" aria-hidden />
                            Nova aula
                          </Button>
                        </li>
                      ) : null}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5">
          {!selectedLesson ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center text-sm text-text-muted">
              <BookOpen className="mb-3 size-8 opacity-40" aria-hidden />
              Selecione uma aula na estrutura ou crie um módulo para começar.
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="lesson-title" className="sr-only">
                  Título da aula
                </Label>
                <Input
                  id="lesson-title"
                  value={lessonDraft.title}
                  disabled={!structure.editable}
                  onChange={(e) => {
                    const title = e.target.value;
                    setLessonDraft((prev) => ({ ...prev, title }));
                    scheduleLessonTitleSave(title);
                  }}
                  className="max-w-xl text-base font-semibold"
                  placeholder="Título da aula"
                />
                <span className="text-xs text-text-muted">
                  {contentSave === "saving"
                    ? "Salvando…"
                    : contentSave === "saved"
                      ? "Salvo"
                      : contentSave === "error"
                        ? "Erro ao salvar"
                        : null}
                </span>
              </div>

              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="lesson-type" className="mb-2 block text-sm font-medium">
                    Tipo de aula
                  </Label>
                  <select
                    id="lesson-type"
                    disabled={!structure.editable}
                    value={lessonDraft.type}
                    onChange={(e) => {
                      const type = e.target.value as LessonTypeCode;
                      setLessonDraft((prev) => ({ ...prev, type }));
                      scheduleLessonTypeSave(type);
                    }}
                    className="h-10 w-full rounded-[var(--radius-input)] border border-border-light bg-background px-3 text-sm disabled:opacity-60"
                  >
                    {LESSON_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {lessonDraft.type !== "TEXT" ? (
                  <div>
                    <Label htmlFor="lesson-url" className="mb-2 block text-sm font-medium">
                      URL do conteúdo
                    </Label>
                    <Input
                      id="lesson-url"
                      type="url"
                      disabled={!structure.editable}
                      value={lessonDraft.externalUrl}
                      onChange={(e) => {
                        const externalUrl = e.target.value;
                        setLessonDraft((prev) => ({ ...prev, externalUrl }));
                        scheduleExternalUrlSave(externalUrl);
                      }}
                      placeholder="https://…"
                    />
                  </div>
                ) : null}
              </div>

              {lessonDraft.type === "TEXT" ? (
              <div>
                <Label htmlFor="lesson-content" className="mb-2 block text-sm font-medium">
                  Conteúdo (texto)
                </Label>
                <textarea
                  id="lesson-content"
                  rows={16}
                  disabled={!structure.editable || !primaryContent}
                  value={lessonDraft.text}
                  onChange={(e) => {
                    const text = e.target.value;
                    setLessonDraft((prev) => ({ ...prev, text }));
                    scheduleContentSave(text);
                  }}
                  className="w-full resize-y rounded-[var(--radius-input)] border border-border-light bg-background px-3 py-2 text-sm leading-relaxed text-text-primary shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Escreva o conteúdo da aula aqui…"
                />
              </div>
              ) : (
                <div>
                  <Label htmlFor="lesson-notes" className="mb-2 block text-sm font-medium">
                    Notas complementares (opcional)
                  </Label>
                  <textarea
                    id="lesson-notes"
                    rows={8}
                    disabled={!structure.editable || !primaryContent}
                    value={lessonDraft.text}
                    onChange={(e) => {
                      const text = e.target.value;
                      setLessonDraft((prev) => ({ ...prev, text }));
                      scheduleContentSave(text);
                    }}
                    className="w-full resize-y rounded-[var(--radius-input)] border border-border-light bg-background px-3 py-2 text-sm leading-relaxed text-text-primary shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="Instruções ou contexto adicional para o aluno…"
                  />
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
