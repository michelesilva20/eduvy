# Learning Core — Implementation Report

## Git

```text
Branch: feat/learning-core-1
Base commit: 58635a17dcd8bf6a78d71863e828c4c6210a9446
Current commit: d6a7095
Commits created:
  - 4e6dee1 docs(learning-core): add project overview and Gate 0/1 documentation
  - 5779d4d feat(courses): enrich course schema, contracts and RBAC seed
  - 5405fb6 feat(courses): add tenant-scoped course domain and lifecycle API
  - d6a7095 feat(courses): integrate real course management UI and BFF
```

## Gate 0 — Baseline

```text
BASELINE
Branch: main → feat/learning-core-1
Commit: 58635a17dcd8bf6a78d71863e828c4c6210a9446
Node: v24.16.0
pnpm: 9.15.4
PostgreSQL: 16 (Docker, porta host 5437)
Prisma: 6.19.3
Tests (API unit): 2 passed (course.slug)
Lint: passed
Typecheck web: passed (após correção de genéricos inválidos em apiFetch)
Typecheck/build API: passed
Build web: passed (rotas /api/courses + /app/courses/[id])
RLS verify: 24 tabelas com FORCE RLS
```

### Achados críticos

1. Sem `CoursesModule` na API
2. `PermissionGuard` / entitlement / `request.tenantId` não estavam ligados
3. Seed sem `role_permissions` → RBAC sempre negava
4. `GET /tenants/mine` quebrava sob FORCE RLS (memberships invisíveis sem `app.user_id`)
5. Frontend de cursos era empty state + wizard local

## Gate 1 — Courses

### Database

```text
Models: Course (enriched), CourseVersion (reused)
Migration: 20260813010000_learning_core_courses
Enums: CourseStatus, CourseVisibility
Indexes: (tenant_id, status), (tenant_id, created_at DESC), (tenant_id, owner_id)
Constraint: workload_minutes >= 0
RLS policies:
  - courses_tenant_isolation (existente)
  - course_versions_tenant_isolation (existente)
  - memberships_own_user_select (NOVA — 002_memberships_own_user.sql)
Seeds: permissions courses.update/delete + RolePermission para TENANT_OWNER
```

### API

```text
Endpoints:
  GET/POST /courses
  GET/PATCH/DELETE /courses/:id
  POST /courses/:id/submit-review
  POST /courses/:id/publish
  POST /courses/:id/archive
  POST /courses/:id/duplicate

Permissions: courses.read|create|update|publish|delete
Entitlement: CORE_COURSES / courses
Guards: TenantGuard → PermissionGuard → EntitlementGuard
Persistence: TenantDatabase.run() only
Audit: course.created|updated|published|archived|duplicated|deleted
Outbox: course.published
```

### Frontend

```text
Pages:
  /app/courses — listagem real (busca, filtro, paginação)
  /app/courses/new — formulário
  /app/courses/:id — detalhe + lifecycle
  /app/courses/:id/edit — edição
BFF: /api/courses/*
UX: empty states orientativos, badges de status, confirmação de arquivar
```

### Tests executados

| Comando | Resultado |
|---------|-----------|
| `pnpm --filter @eduvy/api test` | ✅ 2 passed |
| `pnpm typecheck` | ✅ |
| `pnpm lint` | ✅ |
| `pnpm build` (web) | ✅ |
| `pnpm --filter @eduvy/api build` | ✅ |
| `pnpm exec tsx packages/database/scripts/verify-rls.ts` | ✅ 24 tables |
| `node packages/database/scripts/smoke-courses-rls.mjs` | ✅ PASS |
| `node scripts/smoke-courses-api.mjs` | ✅ create/publish/list + cross-tenant 404 |

### Segurança

```text
Tenant isolation: PASS (RLS smoke + API cross-tenant 404)
RBAC: PASS (seed RolePermission + PermissionGuard)
RLS: PASS (FORCE RLS verified)
Cross-tenant: PASS
```

## Pendências / limitações

- Course Builder com módulos/aulas → Gate 2
- Jest integration RLS (`*.integration.test.ts`) ainda falha por `@types/pg` ausente; smoke RLS cobre o caso
- `pnpm db:migrate` via filter precisa de `DATABASE_MIGRATION_URL` (role `eduvy_migration`)
- Wizard antigo `course-wizard.tsx` permanece no repo, mas não é mais usado
- Auto-save / drag-and-drop deferred to Gate 2

## Próximo Gate

**Gate 2 — CourseModule + Lesson + LessonContent + Course Builder UX**
