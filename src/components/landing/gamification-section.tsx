"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  BadgeCheck,
  Flame,
  Medal,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { achievements } from "@/data/landing";
import { SectionHeading } from "@/components/shared/section-heading";
import { GradientOrb } from "@/components/shared/gradient-orb";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

const iconMap = {
  flame: Flame,
  "badge-check": BadgeCheck,
  medal: Medal,
};

export function GamificationSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const reducedMotion = usePrefersReducedMotion();
  const hasUnlocked = isInView || reducedMotion;

  return (
    <section
      id="gamificacao"
      className="relative overflow-hidden bg-background py-20 md:py-28"
      aria-labelledby="gamification-heading"
    >
      <GradientOrb className="left-0 top-1/4 opacity-25" size="lg" />
      <GradientOrb className="right-0 bottom-0 opacity-20" color="gold" size="md" />

      <div ref={ref} className="relative mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <SectionHeading
          id="gamification-heading"
          title="Cada avanço merece ser percebido."
          description="Transforme progresso em motivação com níveis, desafios e conquistas que fazem sentido para cada jornada."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            <div className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted">Nível atual</p>
                  <p className="font-[family-name:var(--font-sora)] text-3xl font-bold text-text-dark">
                    12
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-muted">XP total</p>
                  <p className="font-[family-name:var(--font-sora)] text-2xl font-bold text-achievement">
                    4.850
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Progresso para nível 13</span>
                  <span>72%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-background-light">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-achievement to-secondary"
                    initial={{ width: reducedMotion ? "72%" : "0%" }}
                    animate={isInView ? { width: "72%" } : undefined}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-6 shadow-lg">
              <p className="font-[family-name:var(--font-sora)] font-bold text-text-dark">
                Missões da semana
              </p>
              <ul className="mt-3 space-y-2">
                {[
                  "Concluir 3 aulas",
                  "Participar do fórum",
                  "Entregar redação",
                ].map((mission) => (
                  <li
                    key={mission}
                    className="flex items-center gap-2 text-sm text-text-dark"
                  >
                    <Target className="size-4 shrink-0 text-secondary" aria-hidden />
                    {mission}
                  </li>
                ))}
              </ul>
            </div>

            <p className="font-[family-name:var(--font-nunito)] text-sm text-text-muted">
              Gamificação configurável: use apenas os recursos que fizerem sentido
              para sua estratégia.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5 shadow-lg sm:col-span-2">
              <p className="font-[family-name:var(--font-sora)] font-bold text-text-dark">
                Conquistas
              </p>
              <ul className="mt-4 space-y-3">
                {achievements.map((achievement) => {
                  const Icon =
                    iconMap[achievement.icon as keyof typeof iconMap] ?? Star;
                  const isUnlockAnim =
                    achievement.id === "top-10" && hasUnlocked && !reducedMotion;
                  const isActive =
                    achievement.unlocked ||
                    (achievement.id === "top-10" && hasUnlocked);

                  return (
                    <li
                      key={achievement.id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3 transition-all duration-500",
                        isActive
                          ? "border-achievement/40 bg-achievement/10"
                          : "border-border-light bg-background-light opacity-70",
                        isUnlockAnim && "scale-[1.01] shadow-md shadow-achievement/15",
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-10 items-center justify-center rounded-xl",
                          isActive
                            ? "bg-achievement/20 text-achievement"
                            : "bg-background-soft text-text-muted",
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <div>
                        <p className="font-[family-name:var(--font-sora)] text-sm font-semibold text-text-dark">
                          {achievement.title}
                        </p>
                        <p className="text-xs text-text-muted">
                          {achievement.description}
                        </p>
                      </div>
                      {isActive && (
                        <BadgeCheck
                          className="ml-auto size-5 text-secondary"
                          aria-label="Conquista desbloqueada"
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5 shadow-lg">
              <div className="flex items-center gap-2">
                <Flame className="size-5 text-achievement" aria-hidden />
                <p className="font-[family-name:var(--font-sora)] font-bold text-text-dark">
                  Sequência
                </p>
              </div>
              <p className="mt-2 font-[family-name:var(--font-sora)] text-3xl font-bold text-achievement">
                7 dias
              </p>
              <p className="text-xs text-text-muted">Estudos consecutivos</p>
            </div>

            <div className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5 shadow-lg">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-primary" aria-hidden />
                <p className="font-[family-name:var(--font-sora)] font-bold text-text-dark">
                  Ranking
                </p>
              </div>
              <p className="mt-2 font-[family-name:var(--font-sora)] text-3xl font-bold text-text-dark">
                #3
              </p>
              <p className="text-xs text-text-muted">Opcional por turma</p>
            </div>

            <div className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5 shadow-lg sm:col-span-2">
              <p className="font-[family-name:var(--font-sora)] font-bold text-text-dark">
                Mapa de habilidades
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Comunicação", "Lógica", "Redação", "Colaboração"].map(
                  (skill, i) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full border border-border-light bg-background-light px-3 py-1 text-xs text-text-dark"
                    >
                      <Zap
                        className={cn(
                          "size-3",
                          i < 3 ? "text-secondary" : "text-text-muted/40",
                        )}
                        aria-hidden
                      />
                      {skill}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
