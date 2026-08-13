# Gate 1 — Courses

## Modelo

`Course` (metadados + ciclo de vida) → `CourseVersion` (versão imutável quando publicada).

### CourseStatus / CourseVersionStatus

`DRAFT` → `IN_REVIEW` → `PUBLISHED` → `ARCHIVED`

### Campos adicionados em Course

- `description`, `shortDescription`, `category`, `workloadMinutes`
- `thumbnailFileId`, `visibility` (`PRIVATE` | `TENANT` | `UNLISTED`)
- `status` migrado de string livre para enum `CourseStatus`

## Endpoints

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/courses` | `courses.read` |
| GET | `/courses/:id` | `courses.read` |
| POST | `/courses` | `courses.create` |
| PATCH | `/courses/:id` | `courses.update` |
| DELETE | `/courses/:id` | `courses.delete` |
| POST | `/courses/:id/submit-review` | `courses.publish` |
| POST | `/courses/:id/publish` | `courses.publish` |
| POST | `/courses/:id/archive` | `courses.update` |
| POST | `/courses/:id/duplicate` | `courses.create` |

Todas exigem:

1. JWT
2. Tenant (`X-Eduvy-Tenant-Id` ou cookie `eduvy_tenant`)
3. Entitlement `CORE_COURSES` / capability `courses`
4. Permissão correspondente

## Regras de domínio

- Criar curso gera `Course` DRAFT + `CourseVersion` v1 DRAFT
- Publicar promove a versão de trabalho e arquiva publicações anteriores
- DELETE em curso publicado/com matrículas → archive (preserva histórico)
- DELETE em rascunho sem matrículas → hard delete

## Frontend

- `/app/courses` — listagem real com busca, filtro e paginação
- `/app/courses/new` — formulário de criação
- `/app/courses/:id` — detalhe + ações de ciclo de vida
- `/app/courses/:id/edit` — edição
- BFF em `/api/courses/*`

## RLS

Políticas existentes mantidas:

- `courses_tenant_isolation`
- `course_versions_tenant_isolation`
