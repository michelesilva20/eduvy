# Gate 8.5 — Learning Core Hardening

Auditoria e endurecimento do Learning Core 1.0 antes de expandir o Assessment Engine.

## Objetivo

Tentar quebrar o domínio educacional existente **antes** de adicionar tentativas, assignments e grading.

## Auditoria de schema

### Já conforme (sem alteração)

| Área | Estado |
|------|--------|
| Matrícula única | `UNIQUE (tenant_id, cohort_id, membership_id, course_version_id)` |
| Progresso único | `UNIQUE (tenant_id, enrollment_id, lesson_id)` |
| Progresso 0–100 | `CHECK progress_percentage BETWEEN 0 AND 100` |
| FKs compostas tenant | Course → Version → Module → Lesson → Content |
| Assessment FKs | AssessmentQuestion, Attempt, AttemptAnswer |

### Lacunas corrigidas

| Lacuna | Correção |
|--------|----------|
| `enrollments.membership_id` sem FK | FK `(tenant_id, membership_id) → memberships` |
| `cohort_instructors.membership_id` sem FK | FK composta para `memberships` |
| `assessment_attempts.membership_id` sem FK | FK composta para `memberships` |
| Cohort com `course_version` de outro curso | FK `(tenant_id, course_id, course_version_id) → course_versions` + índice único |
| `attempt_answers.points_awarded` negativo | `CHECK points_awarded >= 0` |
| `audit_logs` / `outbox_events` visíveis sem tenant | Política fail-closed (`007_fail_closed_nullable_tenant.sql`) |

### Pendente (Gates 9+)

| Item | Motivo |
|------|--------|
| Resposta fora do assessment | Validar em serviço ao implementar attempts |
| `EXPIRED` em `AttemptStatus` | Gate 9 |
| `enrollmentId` em `AssessmentAttempt` | Gate 9 |
| Partial unique attempt IN_PROGRESS | Gate 9 |

## Migration

```text
20260813070000_learning_core_hardening
```

Aplicar com role `eduvy_migration`:

```powershell
$env:DATABASE_URL="postgresql://eduvy_migration:eduvy_migration_dev@localhost:5437/eduvy"
pnpm exec prisma migrate deploy --schema=packages/database/prisma/schema.prisma
pnpm --filter @eduvy/database sql:rls
```

## RLS

- **Role runtime:** `eduvy_app` (sem BYPASSRLS)
- **Role migration:** `eduvy_migration` (DDL apenas)
- **32 tabelas** com FORCE RLS verificado
- **007:** tabelas com `tenant_id` nullable não expõem linhas sem `app.tenant_id`

## Testes de integração

```powershell
$env:DATABASE_URL="postgresql://eduvy_app:eduvy_app_dev@localhost:5437/eduvy"
$env:DATABASE_MIGRATION_URL="postgresql://eduvy_migration:eduvy_migration_dev@localhost:5437/eduvy"
pnpm --filter @eduvy/database test:integration
```

### Cobertura

- Fail-closed em todas as tabelas tenant-scoped
- INSERT negado sem contexto de tenant
- Role runtime sem BYPASSRLS
- Isolamento leitura tenant A vs B
- Cross-tenant INSERT/UPDATE (FK 23503)
- Matrícula duplicada (unique 23505)
- Progresso fora de 0–100 (check 23514)
- DELETE cross-tenant bloqueado por RLS

## Definition of Done

```text
[x] constraints revisadas
[x] indexes revisados
[x] RLS integration tests funcionando
[x] cross-tenant inserts bloqueados
[x] cross-tenant updates bloqueados
[x] cross-tenant deletes bloqueados
[x] runtime DB role validada (eduvy_app)
[x] migrations reproduzíveis
[x] typecheck PASS
[x] lint PASS
[x] API build PASS
[x] commits criados
```
