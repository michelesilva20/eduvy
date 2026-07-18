import {
  BookOpen,
  FileCheck,
  Flame,
  PenLine,
  TrendingUp,
  Trophy,
} from "lucide-react";

const stats = [
  {
    label: "Habilidade",
    value: "Interpretação · Nv. 4",
    icon: TrendingUp,
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    label: "Conquista",
    value: "7 dias seguidos",
    icon: Flame,
    color: "text-achievement",
    bg: "bg-achievement/15",
  },
  {
    label: "Simulado",
    value: "84 de 100 pts",
    icon: FileCheck,
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

export function LearningJourneyVisual() {
  return (
    <div
      className="overflow-hidden rounded-[var(--radius-lg)] border border-border-light bg-surface-light shadow-xl shadow-primary/8"
      aria-hidden
    >
      {/* Cabeçalho do curso */}
      <div className="border-b border-border-light bg-gradient-to-r from-primary/[0.06] to-secondary/[0.04] px-5 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20">
            <BookOpen className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Curso em andamento
            </p>
            <p className="mt-0.5 font-[family-name:var(--font-sora)] text-base font-bold text-[#3d3654] sm:text-lg">
              Preparação para o Vestibular
            </p>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Progresso geral</span>
                <span className="font-semibold text-primary">72%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-background-light">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-primary to-secondary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 divide-y divide-border-light sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map((stat) => (
          <div key={stat.label} className="px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
              >
                <stat.icon className={`size-4 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  {stat.label}
                </p>
                <p className="mt-0.5 font-[family-name:var(--font-nunito)] text-xs font-semibold text-[#3d3654] sm:text-sm">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé do painel */}
      <div className="grid grid-cols-2 gap-px border-t border-border-light bg-border-light">
        <div className="flex items-center gap-3 bg-surface-light px-4 py-4 sm:px-5">
          <Trophy className="size-4 shrink-0 text-achievement" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Ranking
            </p>
            <p className="font-[family-name:var(--font-sora)] text-sm font-bold text-[#3d3654]">
              #3 na turma
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-surface-light px-4 py-4 sm:px-5">
          <PenLine className="size-4 shrink-0 text-primary" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Redação
            </p>
            <p className="font-[family-name:var(--font-nunito)] text-sm font-semibold text-[#3d3654]">
              Correção disponível
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
