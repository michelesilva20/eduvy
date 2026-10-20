# Eduvy

**A multi-tenant learning platform in development.** Eduvy connects courses, cohorts, enrollments, learning progress and assessments through a Next.js interface and a NestJS backend.

This is a software engineering project with an implemented learning/assessment domain. It is not presented as a deployed commercial LMS or an AI-powered product.

## What is implemented

- Identity, tenant context, permission checks and module entitlements.
- Course content, people, cohorts and enrollments.
- Learning progress and instructor views.
- Assessment assignments, attempts, answer submission, automatic grading logic, manual grading and results.
- PostgreSQL migrations and RLS assets, audit records and an asynchronous worker/outbox foundation.
- Unit/integration test files and a CI workflow for validation and builds.

Learning Core and Assessment Engine were merged through PRs [#1](https://github.com/michelesilva20/eduvy/pull/1) and [#2](https://github.com/michelesilva20/eduvy/pull/2). A merged PR establishes source availability, not production readiness or a passing current deployment.

## Architecture

| Layer | Implementation |
| --- | --- |
| Web | Next.js 16, React 19, TypeScript, Tailwind, BFF auth/tenant routes |
| API | NestJS modular monolith; identity, tenancy, authorization, courses and assessments |
| Data | PostgreSQL 16, Prisma, tenant-aware transactions and RLS SQL |
| Async | BullMQ worker, Redis and transactional outbox dispatcher |
| Storage | MinIO for local S3-compatible development |
| Quality | Jest unit tests, database integration tests, GitHub Actions |

```text
Browser → Next.js / BFF → NestJS API → PostgreSQL
                              ↓            ↑
                       Redis / BullMQ → Worker
                              ↓
                       MinIO (local S3)
```

The code separates browser-facing routes, business services and tenant-aware data access. Assessment attempt operations enter `TenantDatabase.run` with tenant/user context. Inspect the [architecture guide](docs/architecture/00-overview.md), [multi-tenancy](docs/architecture/02-multi-tenancy.md) and [RLS guide](docs/architecture/03-rls.md) for enforcement details.

## Repository structure

```text
src/                  Next.js web application and BFF
apps/api/             NestJS REST API
apps/worker/          BullMQ and outbox processing
packages/database/    Prisma, migrations and RLS
packages/config/      Environment validation
packages/contracts/   Shared contracts
packages/logger/      Structured logging
docs/                 Architecture, learning and assessment guides
```

## Run locally

Requirements: Node.js 22, pnpm 9.15.4 and Docker for the local PostgreSQL/Redis/MinIO infrastructure. See the [infrastructure guide](docs/infraestrutura.md) for environment variables and service details.

Copy the root `.env.example` to `.env` and configure the development environment, including application secrets and the migration/runtime database connections. Never commit the filled file or reuse development-only credentials in deployment.

Run database commands only against your disposable local environment:

```sh
pnpm install --frozen-lockfile
pnpm infra:up
pnpm db:generate
pnpm build:packages
pnpm db:migrate
pnpm --filter @eduvy/database sql:post-migrate
pnpm db:seed
```

Start the services in separate terminals:

```sh
pnpm dev:api
pnpm dev:worker
pnpm dev
```

Web: `http://localhost:3000`. API documentation: `http://localhost:4000/api/docs`.

## Validate

```sh
pnpm typecheck:all
pnpm lint
pnpm test:unit
pnpm test:integration
pnpm build:api
pnpm build:worker
pnpm build
```

Database integration tests require the configured database, runtime/migration roles and RLS setup. The [CI workflow](.github/workflows/ci.yml) documents its isolated preparation sequence. This portfolio audit inspected selected code, tests and configuration; it did not execute the complete Eduvy suite or independently reproduce historical PASS claims.

## Limits and next steps

- No staging or production deployment is established by this repository presentation.
- Mobile UX and accessibility still need review in the [release checklist](docs/release/ASSESSMENT_ENGINE_1_READINESS.md).
- Worker infrastructure does not imply that every external integration is complete; email processing includes placeholder behavior.
- Product AI is not claimed. The implemented assessment grading logic must not be confused with generative AI.
- Priorities: reproduce the complete CI gates, review accessibility/device journeys, and demonstrate an isolated cross-tenant assessment scenario.

## Technical documentation

[Learning Core](docs/learning-core/00-overview.md) · [Assessment Engine](docs/assessment-engine/00-overview.md) · [Implementation report](docs/assessment-engine/IMPLEMENTATION_REPORT.md) · [Release readiness](docs/release/ASSESSMENT_ENGINE_1_READINESS.md)

## Em português

O Eduvy é uma plataforma de aprendizagem em desenvolvimento, com cursos, turmas, matrículas, progresso e avaliações. Demonstra backend NestJS, PostgreSQL, isolamento multi-tenant e processamento assíncrono. O README anterior era o padrão do Next.js; os guias técnicos acima descrevem o domínio real. Não há afirmação de uso comercial ou IA integrada.
