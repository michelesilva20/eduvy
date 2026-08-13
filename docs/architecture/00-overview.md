# Eduvy — Visão geral da arquitetura

> **Documento principal:** [Visão completa do projeto](../projeto-completo.md)  
> **Guia operacional:** [Infraestrutura e operação](../infraestrutura.md)

## Estado atual

Monorepo pnpm com:

| Pacote | Responsabilidade |
|--------|------------------|
| `@eduvy/web` | Next.js 16 — landing, login, plataforma + BFF auth/tenant |
| `@eduvy/api` | NestJS — API REST `/api/v1` |
| `@eduvy/worker` | BullMQ — jobs assíncronos, outbox dispatcher |
| `@eduvy/database` | Prisma + SQL (RLS, roles) |
| `@eduvy/config` | Validação de env (Zod) |
| `@eduvy/logger` | Pino estruturado + redaction |
| `@eduvy/contracts` | Constantes compartilhadas |

## Infra local

Ver passo a passo em [infraestrutura.md §10](./infraestrutura.md#10-como-rodar-localmente).

```bash
pnpm infra:up
pnpm db:generate && pnpm build:packages
pnpm db:migrate
pnpm --filter @eduvy/database sql:post-migrate
pnpm db:seed
pnpm dev:api   # :4000
pnpm dev       # :3000
```

## Diagrama de contexto

```mermaid
flowchart TB
  Web[Next.js Web + BFF]
  API[NestJS API]
  Worker[Worker]
  PG[(PostgreSQL + RLS)]
  Redis[(Redis)]
  MinIO[(MinIO S3)]
  Web -->|server-side| API
  API --> PG
  API --> Redis
  Worker --> PG
  Worker --> Redis
  API --> MinIO
```

## Princípios

- Monólito modular (extrair serviços depois)
- Multi-tenant: `tenant_id` + RLS
- Autorização RBAC + escopo (fail closed)
- Outbox transacional + BullMQ
- Auditoria append-only sanitizada

Ver ADRs em `docs/adr/`.
