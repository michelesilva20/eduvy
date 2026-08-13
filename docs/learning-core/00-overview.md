# Learning Core 1.0 — Overview

Iniciativa para transformar a fundação SaaS do Eduvy em um LMS funcional, de forma incremental.

## Escopo desta entrega (Gate 0 + Gate 1)

- Baseline e auditoria do monorepo
- Domínio **Courses + CourseVersion** como módulo de referência
- API tenant-scoped com RLS + RBAC + entitlements
- UI real de listagem, criação, edição e ciclo de vida

## Ordem dos Gates

| Gate | Domínio |
|------|---------|
| 0 | Baseline |
| 1 | Courses + CourseVersion |
| 2 | CourseModule + Lesson + LessonContent |
| 3 | People (students/instructors) |
| 4 | Cohorts |
| 5 | Enrollments |
| 6 | Progress + Student Player |
| 7 | Instructor progress |
| 8 | Assessment foundation |

## Branch

`feat/learning-core-1`

## Documentos

- [01-courses.md](./01-courses.md)
- [IMPLEMENTATION_REPORT.md](./IMPLEMENTATION_REPORT.md)
