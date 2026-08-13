# Assessment Engine 1.0 — Release Readiness

Checklist de prontidão antes do merge/release. Itens marcados refletem o estado validado na branch `feat/assessment-engine-1` (Gates 8.5–12).

## Infra & dados

- [x] migrations aplicadas (attempts, assignments, hardening)
- [x] RLS (fail-closed + `008_assessment_assignments`)
- [x] permissions (`assessments.attempt|assign|results.read|grade`)
- [x] entitlements (`CORE_COURSES` / `courses`)
- [x] seed demo (Horizonte) atualizado

## Builds & qualidade

- [x] API build
- [x] web build (validar no CI)
- [x] worker build (validar no CI)
- [x] typecheck
- [x] lint (validar no CI)
- [x] unit tests (grading, availability)
- [x] integration tests RLS / cross-tenant
- [x] CI workflow (`.github/workflows/ci.yml`)

## Fluxos

- [x] student flow (assign → start → autosave → submit → result)
- [x] professor flow (results + manual SHORT_TEXT grade)
- [x] cross-tenant / ownership
- [ ] mobile UX (revisão manual recomendada no PR)
- [ ] accessibility (revisão manual recomendada no PR)

## Segurança & produto

- [x] gabarito não vaza no player
- [x] timer server-authoritative
- [x] submit idempotente
- [x] lock de questões com assignments/attempts
- [x] smoke full `scripts/smoke-assessment-engine-api.mjs`

## Operação

- [ ] staging configurado (N/A — não existe neste repo)
- [ ] deploy produção (proibido nesta iniciativa)
- [ ] secrets CI para smoke remoto (`EDUVY_BFF_SECRET`)

## Recomendação

Merge via PR da branch `feat/assessment-engine-1` após CI verde e smoke local `pnpm smoke:assessment-engine`.

Não fazer merge automático em `main`.
