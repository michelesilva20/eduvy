"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/platform/shared/page-header";
import { cn } from "@/lib/utils";

const steps = [
  "Informações básicas",
  "Estrutura",
  "Conteúdos",
  "Avaliações",
  "Gamificação",
  "Certificado",
  "Publicação",
];

export function CourseWizardClient() {
  const [step, setStep] = useState(0);

  return (
    <>
      <PageHeader
        title="Criar curso"
        description="Configure seu curso em etapas antes de publicar para os alunos."
      />

      <nav aria-label="Etapas do curso" className="mb-8 overflow-x-auto">
        <ol className="flex min-w-max gap-2">
          {steps.map((label, index) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(index)}
                className={cn(
                  "focus-ring flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                  index === step
                    ? "border-primary bg-primary/10 text-primary"
                    : index < step
                      ? "border-secondary/40 bg-secondary/10 text-emerald-700"
                      : "border-border-light bg-surface-light text-text-muted",
                )}
              >
                {index < step ? <Check className="size-3.5" /> : <span>{index + 1}</span>}
                {label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-6 md:p-8">
        {step === 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="course-name">Nome do curso</Label>
              <Input id="course-name" placeholder="Ex.: Preparação ENEM — Linguagens" className="mt-1.5" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="course-desc">Descrição</Label>
              <textarea
                id="course-desc"
                rows={4}
                className="mt-1.5 w-full rounded-2xl border border-border-light bg-surface-light px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Descreva objetivos e público-alvo…"
              />
            </div>
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" placeholder="Vestibular" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="modality">Modalidade</Label>
              <select id="modality" className="mt-1.5 h-11 w-full rounded-full border border-border-light px-4 text-sm">
                <option>Online</option>
                <option>Híbrido</option>
                <option>Ao vivo</option>
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-text-muted">Adicione módulos e aulas. Reordenação disponível na integração com API.</p>
            {["Módulo 1 — Fundamentos", "Módulo 2 — Prática", "Módulo 3 — Revisão"].map((mod) => (
              <div key={mod} className="rounded-xl border border-border-light bg-background-light p-4">
                <p className="font-semibold text-[#3d3654]">{mod}</p>
                <p className="text-xs text-text-muted">3 aulas · 6h</p>
              </div>
            ))}
            <Button variant="secondary">Adicionar módulo</Button>
          </div>
        )}

        {step === 6 && (
          <ul className="space-y-2 text-sm">
            {[
              "Informações completas",
              "Capa definida",
              "Conteúdo cadastrado",
              "Professor vinculado",
              "Certificado configurado",
              "Visibilidade definida",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-[#3d3654]">
                <Check className="size-4 text-emerald-600" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        )}

        {step > 1 && step < 6 && (
          <p className="text-sm text-text-muted">
            Layout preparado para a etapa &quot;{steps[step]}&quot;. Integração com backend em fase futura.
          </p>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <Button
          variant="secondary"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          <ChevronLeft className="size-4" />
          Anterior
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>
            Próximo
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button asChild>
            <Link href="/app/courses">Publicar curso</Link>
          </Button>
        )}
      </div>
    </>
  );
}
