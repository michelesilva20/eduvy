# Gate 2 — Course Content (Modules, Lessons, LessonContent)

## Modelo

`CourseVersion` (DRAFT/IN_REVIEW editável) → `CourseModule` → `Lesson` → `LessonContent`

### Enums

- **LessonType:** `VIDEO`, `TEXT`, `DOCUMENT`, `LINK`
- **LessonStatus:** `DRAFT`, `PUBLISHED`, `ARCHIVED`
- **LessonContentType:** `RICH_TEXT`, `VIDEO`, `FILE`, `IMAGE`, `LINK`, `EMBED`

### Campos enriquecidos

**CourseModule:** `description`, `isRequired`, `estimatedMinutes`, timestamps

**Lesson:** `description`, `type`, `estimatedMinutes`, `isRequired`, `isPreview`, `status`, timestamps

**LessonContent:** `type`, `sortOrder`, `textContent`, `fileId`, `externalUrl`, `metadata`

## Endpoints

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/courses/:id/structure` | `course_content.read` |
| POST | `/courses/:id/modules` | `course_content.manage` |
| PATCH | `/courses/:id/modules/reorder` | `course_content.manage` |
| PATCH | `/courses/:id/modules/:moduleId` | `course_content.manage` |
| DELETE | `/courses/:id/modules/:moduleId` | `course_content.manage` |
| POST | `/courses/:id/modules/:moduleId/lessons` | `course_content.manage` |
| PATCH | `/courses/:id/modules/:moduleId/lessons/reorder` | `course_content.manage` |
| PATCH | `/courses/:id/lessons/:lessonId` | `course_content.manage` |
| DELETE | `/courses/:id/lessons/:lessonId` | `course_content.manage` |
| PATCH | `/courses/:id/lessons/:lessonId/contents/:contentId` | `course_content.manage` |

Todas exigem JWT, tenant, entitlement `CORE_COURSES` e permissão correspondente.

## Regras de domínio

- Estrutura editável apenas em versão `DRAFT` ou `IN_REVIEW`
- Cursos `ARCHIVED` não permitem edição
- Cursos publicados sem versão editável exigem duplicação
- Criar aula gera automaticamente um bloco `RICH_TEXT` vazio
- Duplicar curso copia módulos, aulas e conteúdos da versão fonte
- Reorder exige lista completa de IDs do escopo (módulos ou aulas)

## Frontend

- `/app/courses/:id/builder` — Course Builder (módulos, aulas, texto, drag-and-drop, URL de mídia)
- BFF em `/api/courses/:id/structure`, `/modules`, `/lessons`, `/contents`
- Detalhe do curso linka para o builder

## RLS

- `lesson_contents_tenant_isolation` em `lesson_contents`
- Políticas existentes mantidas em `course_modules`, `lessons`

## Migration

`20260813020000_learning_core_content`

## Smoke test

```bash
node --env-file=.env scripts/smoke-content-api.mjs
```
