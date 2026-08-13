# Learning Core — Implementation Report

## Git

```text
Branch: feat/learning-core-1
Base commit: 58635a17dcd8bf6a78d71863e828c4c6210a9446
Current commit: f13a8f4
Commits created:
  - 4e6dee1 docs(learning-core): add project overview and Gate 0/1 documentation
  - 5779d4d feat(courses): enrich course schema, contracts and RBAC seed
  - 5405fb6 feat(courses): add tenant-scoped course domain and lifecycle API
  - d6a7095 feat(courses): integrate real course management UI and BFF
  - 76ae976 feat(database): add learning-core domain models through assessments
  - e1917d0 feat(content): add course modules, lessons and builder UI
  - b940c96 feat(people): add students and instructors management
  - dcbfd15 feat(cohorts): implement cohort management
  - 5796386 feat(enrollments): implement student enrollment workflow
  - abdb6ea feat(progress): add student player and instructor cohort progress
  - 05eb6d9 feat(assessments): add assessment domain foundation
  - f13a8f4 docs(learning-core): document gates 2-8 and final status
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

- Jest integration RLS (`*.integration.test.ts`) ainda falha por `@types/pg` ausente; smoke RLS cobre o caso
- `pnpm db:migrate` via filter precisa de `DATABASE_MIGRATION_URL` (role `eduvy_migration`)
- Upload de arquivo binário (FILE/IMAGE) → pipeline de mídia futuro; Gate 2 entrega URL para VIDEO/LINK/DOCUMENT
- Aceite automático de convites → integração identity/e-mail assíncrono

## Gate 2 — Course Content (finalizado)

### Polish Gate 2

- Removido `course-wizard.tsx` órfão
- Drag-and-drop nativo no builder (módulos e aulas)
- Seletor de tipo de aula + URL externa para VIDEO/LINK/DOCUMENT

### Database

```text
Models: CourseModule (enriched), Lesson (enriched), LessonContent (NEW)
Migration: 20260813020000_learning_core_content
Enums: LessonType, LessonStatus, LessonContentType
RLS: lesson_contents_tenant_isolation (003_lesson_contents.sql)
Seeds: course_content.read|manage + RolePermission TENANT_OWNER
```

### API

```text
Endpoints: GET /courses/:id/structure
           POST/PATCH/DELETE modules + reorder
           POST/PATCH/DELETE lessons + reorder
           PATCH lesson contents
Permissions: course_content.read|manage
Duplicate: copia estrutura completa da versão fonte
```

### Frontend

```text
Pages: /app/courses/:id/builder — Course Builder
BFF: /api/courses/:id/structure, /modules, /lessons, /contents
UX: sidebar de módulos/aulas, editor de texto, autosave, reorder up/down
Detalhe: link "Editar conteúdo" / "Abrir builder"
```

### Tests executados (Gate 2)

| Comando | Resultado |
|---------|-----------|
| `pnpm --filter @eduvy/api build` | ✅ |
| `pnpm typecheck` | ✅ |
| `node scripts/smoke-content-api.mjs` | ✅ módulo → aula → conteúdo → reorder |
| `pnpm exec tsx packages/database/scripts/verify-rls.ts` | ✅ 25 tables |

## Gate 3 — People

### Database / RBAC

```text
Sem novos modelos de identidade
Permissões: students.read|manage, instructors.read|manage
Roles system: STUDENT, INSTRUCTOR, ACADEMIC_MANAGER por tenant
Seed demo: aluno@horizonte.demo, professor@horizonte.demo
```

### API

```text
GET/POST /students, GET /students/:id, POST /students/invite
GET/POST /instructors, GET /instructors/:id, POST /instructors/invite
GET /invitations, POST /invitations/:id/revoke
```

### Frontend

```text
/app/students, /app/students/:id
/app/teachers, /app/teachers/:id
BFF /api/students/*, /api/instructors/*
Convite inline + tabela paginada
```

### Tests

| Comando | Resultado |
|---------|-----------|
| `node scripts/smoke-people-api.mjs` | ✅ list + invite |

## Gate 4 — Cohorts

### Database

```text
Models: Cohort (enriched), CohortInstructor (NEW)
Migration: 20260813030000_learning_core_cohorts
Enums: CohortStatus, CohortInstructorRole
RLS: cohort_instructors_tenant_isolation
Permissions: cohorts.read|create|update|manage_students
```

### API

```text
CRUD /cohorts + open/start/complete/archive
GET/POST/DELETE /cohorts/:id/instructors
```

### Frontend

```text
/app/classes, /app/classes/new, /app/classes/:id
BFF /api/cohorts/*
Tabs: visão geral + professores
```

### Tests

| Comando | Resultado |
|---------|-----------|
| `node scripts/smoke-cohorts-api.mjs` | ✅ create/open/assign/list |
| RLS verify | ✅ 26 tables |

## Gate 5 — Enrollments

### Database

```text
Model: Enrollment (enriched)
Migration: 20260813040000_learning_core_enrollments
Enum: EnrollmentStatus
Permissions: enrollments.read|create|cancel
```

### API

```text
GET/POST /cohorts/:id/enrollments
POST /cohorts/:id/enrollments/bulk
POST /enrollments/:id/cancel
```

### Frontend

```text
Aba Alunos em /app/classes/:id
Bulk select + matricular + cancelar
```

### Tests

| Comando | Resultado |
|---------|-----------|
| `node scripts/smoke-enrollments-api.mjs` | ✅ enroll/bulk/cancel |

## Gate 6 — Progress + Student Player

### Database

```text
Model: LessonProgress (NEW)
Migration: 20260813050000_learning_core_progress
Enum: LessonProgressStatus
RLS: lesson_progress_tenant_isolation (005_lesson_progress.sql)
Permission: learning_progress.read (+ RolePermission STUDENT / TENANT_OWNER)
```

### API

```text
GET  /learning/my-courses
GET  /learning/:enrollmentId
POST /learning/:enrollmentId/lessons/:lessonId/start
POST /learning/:enrollmentId/lessons/:lessonId/complete
Ownership: enrollment.membership.userId === current user
Progress: completedLessons / totalLessons
```

### Frontend

```text
/app/learning — Meus cursos
/app/learning/:enrollmentId — Player full-screen
BFF /api/learning/*
Nav: Meus cursos
```

### Tests

| Comando | Resultado |
|---------|-----------|
| `pnpm --filter @eduvy/api build` | ✅ |
| `pnpm typecheck` | ✅ |
| `node scripts/smoke-learning-api.mjs` | ✅ my-courses/start/complete/idempotent |
| `pnpm exec tsx packages/database/scripts/verify-rls.ts` | ✅ 27 tables |

## Gate 7 — Instructor Progress

### API / RBAC

```text
GET /cohorts/:id/progress?filter=&search=&page=&limit=
Permission: learning_progress.read
Seed INSTRUCTOR: courses.read, cohorts.read, enrollments.read,
                 learning_progress.read, students.read, instructors.read
```

### Frontend

```text
Aba Progresso em /app/classes/:id
Tabela + filtros Todos/Não iniciados/Em andamento/Concluídos
BFF /api/cohorts/:id/progress
```

### Tests

| Comando | Resultado |
|---------|-----------|
| `pnpm --filter @eduvy/api build` | ✅ |
| `pnpm typecheck` | ✅ |
| `node scripts/smoke-cohort-progress-api.mjs` | ✅ NOT_STARTED→COMPLETED + professor |

## Gate 8 — Assessment foundation

### Database

```text
Models: Question, Assessment, AssessmentQuestion, AssessmentAttempt, AttemptAnswer
Migration: 20260813060000_learning_core_assessments
RLS: 006_assessments.sql
Permissions: questions.read|manage, assessments.read|create|update|publish
```

### API / Frontend

```text
CRUD /questions + CRUD /assessments + attach/publish/archive
UI: /app/assessments, /new, /:id
Attempts: schema only (player deferred)
```

### Tests

| Comando | Resultado |
|---------|-----------|
| `pnpm --filter @eduvy/api build` | ✅ |
| `pnpm typecheck` | ✅ |
| `node scripts/smoke-assessments-api.mjs` | ✅ create/attach/publish |
| `pnpm exec tsx packages/database/scripts/verify-rls.ts` | ✅ 32 tables |

## Learning Core 1.0

Gates 0–8 implementados nesta branch. Próximos incrementos: player de avaliação, tipos avançados, vínculo turma/aula.
