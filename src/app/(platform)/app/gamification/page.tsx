import { Trophy, Zap, Target, Medal } from "lucide-react";
import { platformMetadata } from "@/lib/platform/metadata";
import { PageHeader } from "@/components/platform/shared/page-header";
import { PlatformCard, PlatformCardBody } from "@/components/platform/shared/platform-card";
import { journeySnapshot } from "@/mocks/platform";

export const metadata = platformMetadata("Gamificação");

const rankings = [
  { name: "Turma ENEM 2026", xp: 8420, position: 1 },
  { name: "Turma Redação", xp: 7150, position: 2 },
  { name: "Reforço Matemática", xp: 6280, position: 3 },
];

export default function GamificationPage() {
  return (
    <>
      <PageHeader
        title="Gamificação"
        description="Níveis, XP, conquistas e rankings com visual profissional e elegante."
      />

      <div>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Zap, label: "XP total", value: journeySnapshot.xp.toLocaleString("pt-BR") },
            { icon: Trophy, label: "Nível org.", value: `Nv. ${journeySnapshot.level}` },
            { icon: Target, label: "Meta mensal", value: `${journeySnapshot.monthlyProgress}%` },
            { icon: Medal, label: "Conquistas", value: "24" },
          ].map(({ icon: Icon, label, value }) => (
            <PlatformCard key={label}>
              <PlatformCardBody>
                <Icon className="size-5 text-primary" aria-hidden />
                <p className="mt-3 text-sm text-text-muted">{label}</p>
                <p className="font-[family-name:var(--font-sora)] text-2xl font-bold text-text-primary">{value}</p>
              </PlatformCardBody>
            </PlatformCard>
          ))}
        </div>

        <PlatformCard>
          <PlatformCardBody>
            <h2 className="font-[family-name:var(--font-sora)] text-lg font-bold text-text-primary">Ranking por turma</h2>
            <ol className="mt-4 space-y-3">
              {rankings.map((item) => (
                <li key={item.name} className="flex items-center justify-between rounded-xl border border-border bg-background-soft px-4 py-3">
                  <span className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full bg-background-purple-soft text-sm font-bold text-primary">
                      {item.position}
                    </span>
                    {item.name}
                  </span>
                  <span className="font-semibold text-primary">{item.xp.toLocaleString("pt-BR")} XP</span>
                </li>
              ))}
            </ol>
          </PlatformCardBody>
        </PlatformCard>
      </div>
    </>
  );
}
