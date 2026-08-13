import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CourseDto,
  CourseListItemDto,
  CourseStatusCode,
  CourseVisibilityCode,
  PaginatedCoursesDto,
} from "@eduvy/contracts";
import { CourseStatus, CourseVisibility, TenantDatabase, type Prisma } from "@eduvy/database";
import { InjectTenantDb } from "../../common/database/database.module";
import { mapCourse, mapCourseListItem } from "./course.mapper";
import { CourseContentService } from "./course-content.service";
import { ensureUniqueCourseSlug, slugifyCourseTitle } from "./course.slug";

export interface CreateCourseInput {
  tenantId: string;
  userId: string;
  requestId: string;
  title: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  workloadMinutes?: number;
  visibility?: CourseVisibilityCode;
  slug?: string;
}

export interface UpdateCourseInput {
  tenantId: string;
  userId: string;
  requestId: string;
  courseId: string;
  title?: string;
  description?: string | null;
  shortDescription?: string | null;
  category?: string | null;
  workloadMinutes?: number | null;
  visibility?: CourseVisibilityCode;
  slug?: string;
}

export interface ListCoursesInput {
  tenantId: string;
  userId: string;
  requestId: string;
  search?: string;
  status?: CourseStatusCode;
  category?: string;
  createdBy?: string;
  sort?: "createdAt_desc" | "createdAt_asc" | "title_asc" | "title_desc" | "updatedAt_desc";
  page?: number;
  limit?: number;
}

const versionInclude = {
  versions: {
    orderBy: { version: "desc" as const },
    take: 5,
  },
  _count: { select: { versions: true } },
};

@Injectable()
export class CoursesService {
  constructor(
    @InjectTenantDb() private readonly tenantDb: TenantDatabase,
    private readonly courseContent: CourseContentService,
  ) {}

  async list(input: ListCoursesInput): Promise<PaginatedCoursesDto> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const skip = (page - 1) * limit;

    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const where: Prisma.CourseWhereInput = {};

        if (input.status) where.status = input.status as CourseStatus;
        if (input.category) where.category = input.category;
        if (input.createdBy) where.ownerId = input.createdBy;
        if (input.search?.trim()) {
          const q = input.search.trim();
          where.OR = [
            { title: { contains: q, mode: "insensitive" } },
            { shortDescription: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ];
        }

        const orderBy = this.resolveOrderBy(input.sort);

        const [total, rows] = await Promise.all([
          tx.course.count({ where }),
          tx.course.findMany({
            where,
            include: {
              versions: {
                orderBy: { version: "desc" },
                take: 1,
              },
            },
            orderBy,
            skip,
            take: limit,
          }),
        ]);

        return {
          items: rows.map((row) => mapCourseListItem(row)),
          meta: {
            page,
            limit,
            total,
            hasMore: skip + rows.length < total,
          },
        };
      },
    );
  }

  async getById(input: {
    tenantId: string;
    userId: string;
    requestId: string;
    courseId: string;
  }): Promise<CourseDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const course = await tx.course.findFirst({
          where: { id: input.courseId },
          include: versionInclude,
        });
        if (!course) {
          throw new NotFoundException({
            code: "COURSE_NOT_FOUND",
            message: "Curso não encontrado.",
          });
        }
        return mapCourse(course);
      },
    );
  }

  async create(input: CreateCourseInput): Promise<CourseDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const baseSlug = slugifyCourseTitle(input.slug?.trim() || input.title);
        const slug = await ensureUniqueCourseSlug(baseSlug, async (candidate) => {
          const existing = await tx.course.findFirst({ where: { slug: candidate } });
          return Boolean(existing);
        });

        const created = await tx.course.create({
          data: {
            tenantId: input.tenantId,
            slug,
            title: input.title.trim(),
            description: input.description?.trim() || null,
            shortDescription: input.shortDescription?.trim() || null,
            category: input.category?.trim() || null,
            workloadMinutes: input.workloadMinutes ?? null,
            visibility: (input.visibility as CourseVisibility | undefined) ?? CourseVisibility.TENANT,
            status: CourseStatus.DRAFT,
            ownerId: input.userId,
          },
        });

        await tx.courseVersion.create({
          data: {
            tenantId: input.tenantId,
            courseId: created.id,
            version: 1,
            status: "DRAFT",
          },
        });

        const course = await tx.course.findFirstOrThrow({
          where: { id: created.id },
          include: versionInclude,
        });

        await tx.auditLog.create({
          data: {
            tenantId: input.tenantId,
            actorType: "USER",
            actorUserId: input.userId,
            action: "course.created",
            resourceType: "course",
            resourceId: course.id,
            requestId: input.requestId,
            afterData: { title: course.title, slug: course.slug, status: course.status },
          },
        });

        return mapCourse(course);
      },
    );
  }

  async update(input: UpdateCourseInput): Promise<CourseDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const existing = await tx.course.findFirst({ where: { id: input.courseId } });
        if (!existing) {
          throw new NotFoundException({
            code: "COURSE_NOT_FOUND",
            message: "Curso não encontrado.",
          });
        }

        if (existing.status === CourseStatus.ARCHIVED) {
          throw new BadRequestException({
            code: "COURSE_ARCHIVED",
            message: "Cursos arquivados não podem ser editados.",
          });
        }

        let slug = existing.slug;
        if (input.slug !== undefined || input.title !== undefined) {
          const desired = slugifyCourseTitle(input.slug?.trim() || input.title || existing.title);
          if (desired !== existing.slug) {
            slug = await ensureUniqueCourseSlug(desired, async (candidate) => {
              const conflict = await tx.course.findFirst({
                where: { slug: candidate, NOT: { id: existing.id } },
              });
              return Boolean(conflict);
            });
          }
        }

        const course = await tx.course.update({
          where: { id: existing.id },
          data: {
            title: input.title?.trim() ?? undefined,
            description: input.description === undefined ? undefined : input.description,
            shortDescription:
              input.shortDescription === undefined ? undefined : input.shortDescription,
            category: input.category === undefined ? undefined : input.category,
            workloadMinutes:
              input.workloadMinutes === undefined ? undefined : input.workloadMinutes,
            visibility: input.visibility as CourseVisibility | undefined,
            slug,
          },
          include: versionInclude,
        });

        await tx.auditLog.create({
          data: {
            tenantId: input.tenantId,
            actorType: "USER",
            actorUserId: input.userId,
            action: "course.updated",
            resourceType: "course",
            resourceId: course.id,
            requestId: input.requestId,
            beforeData: { title: existing.title, slug: existing.slug },
            afterData: { title: course.title, slug: course.slug },
          },
        });

        return mapCourse(course);
      },
    );
  }

  async submitForReview(input: {
    tenantId: string;
    userId: string;
    requestId: string;
    courseId: string;
  }): Promise<CourseDto> {
    return this.transition(input, {
      from: [CourseStatus.DRAFT],
      to: CourseStatus.IN_REVIEW,
      versionTo: "IN_REVIEW",
      action: "course.submitted_for_review",
      invalidMessage: "Somente cursos em rascunho podem ser enviados para revisão.",
    });
  }

  async publish(input: {
    tenantId: string;
    userId: string;
    requestId: string;
    courseId: string;
  }): Promise<CourseDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const course = await tx.course.findFirst({
          where: { id: input.courseId },
          include: { versions: { orderBy: { version: "desc" } } },
        });
        if (!course) {
          throw new NotFoundException({
            code: "COURSE_NOT_FOUND",
            message: "Curso não encontrado.",
          });
        }

        if (course.status === CourseStatus.ARCHIVED) {
          throw new BadRequestException({
            code: "COURSE_ARCHIVED",
            message: "Cursos arquivados não podem ser publicados.",
          });
        }

        const working =
          course.versions.find((v) => v.status === "DRAFT" || v.status === "IN_REVIEW") ??
          course.versions[0];

        if (!working) {
          throw new BadRequestException({
            code: "COURSE_VERSION_MISSING",
            message: "O curso não possui versão para publicação.",
          });
        }

        if (working.status === "PUBLISHED" && course.status === CourseStatus.PUBLISHED) {
          throw new ConflictException({
            code: "COURSE_ALREADY_PUBLISHED",
            message: "Este curso já está publicado.",
          });
        }

        await tx.courseVersion.updateMany({
          where: {
            courseId: course.id,
            status: "PUBLISHED",
            NOT: { id: working.id },
          },
          data: { status: "ARCHIVED" },
        });

        await tx.courseVersion.update({
          where: { id: working.id },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
          },
        });

        const updated = await tx.course.update({
          where: { id: course.id },
          data: { status: CourseStatus.PUBLISHED },
          include: versionInclude,
        });

        await tx.auditLog.create({
          data: {
            tenantId: input.tenantId,
            actorType: "USER",
            actorUserId: input.userId,
            action: "course.published",
            resourceType: "course",
            resourceId: course.id,
            requestId: input.requestId,
            metadata: { versionId: working.id, version: working.version },
          },
        });

        await tx.outboxEvent.create({
          data: {
            tenantId: input.tenantId,
            aggregateType: "course",
            aggregateId: course.id,
            eventType: "course.published",
            payload: {
              courseId: course.id,
              versionId: working.id,
              version: working.version,
            },
          },
        });

        return mapCourse(updated);
      },
    );
  }

  async archive(input: {
    tenantId: string;
    userId: string;
    requestId: string;
    courseId: string;
  }): Promise<CourseDto> {
    return this.transition(input, {
      from: [CourseStatus.DRAFT, CourseStatus.IN_REVIEW, CourseStatus.PUBLISHED],
      to: CourseStatus.ARCHIVED,
      versionTo: "ARCHIVED",
      action: "course.archived",
      invalidMessage: "Este curso já está arquivado.",
      archiveAllVersions: true,
    });
  }

  async duplicate(input: {
    tenantId: string;
    userId: string;
    requestId: string;
    courseId: string;
  }): Promise<CourseDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const source = await tx.course.findFirst({ where: { id: input.courseId } });
        if (!source) {
          throw new NotFoundException({
            code: "COURSE_NOT_FOUND",
            message: "Curso não encontrado.",
          });
        }

        const baseSlug = slugifyCourseTitle(`${source.slug}-copia`);
        const slug = await ensureUniqueCourseSlug(baseSlug, async (candidate) => {
          const existing = await tx.course.findFirst({ where: { slug: candidate } });
          return Boolean(existing);
        });

        const created = await tx.course.create({
          data: {
            tenantId: input.tenantId,
            slug,
            title: `${source.title} (cópia)`,
            description: source.description,
            shortDescription: source.shortDescription,
            category: source.category,
            workloadMinutes: source.workloadMinutes,
            thumbnailFileId: source.thumbnailFileId,
            visibility: source.visibility,
            status: CourseStatus.DRAFT,
            ownerId: input.userId,
          },
        });

        const sourceVersion = await tx.courseVersion.findFirst({
          where: { courseId: source.id },
          orderBy: { version: "desc" },
        });

        const newVersion = await tx.courseVersion.create({
          data: {
            tenantId: input.tenantId,
            courseId: created.id,
            version: 1,
            status: "DRAFT",
          },
        });

        if (sourceVersion) {
          await this.courseContent.copyStructureFromVersion(
            tx,
            input.tenantId,
            sourceVersion.id,
            newVersion.id,
          );
        }

        const course = await tx.course.findFirstOrThrow({
          where: { id: created.id },
          include: versionInclude,
        });

        await tx.auditLog.create({
          data: {
            tenantId: input.tenantId,
            actorType: "USER",
            actorUserId: input.userId,
            action: "course.duplicated",
            resourceType: "course",
            resourceId: course.id,
            requestId: input.requestId,
            metadata: { sourceCourseId: source.id },
          },
        });

        return mapCourse(course);
      },
    );
  }

  async remove(input: {
    tenantId: string;
    userId: string;
    requestId: string;
    courseId: string;
  }): Promise<{ id: string; deleted: boolean; archived: boolean }> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const course = await tx.course.findFirst({
          where: { id: input.courseId },
          include: {
            versions: {
              include: { enrollments: { take: 1 } },
            },
          },
        });

        if (!course) {
          throw new NotFoundException({
            code: "COURSE_NOT_FOUND",
            message: "Curso não encontrado.",
          });
        }

        const hasEnrollments = course.versions.some((version) => version.enrollments.length > 0);
        if (hasEnrollments || course.status === CourseStatus.PUBLISHED) {
          await tx.course.update({
            where: { id: course.id },
            data: { status: CourseStatus.ARCHIVED },
          });
          await tx.courseVersion.updateMany({
            where: { courseId: course.id },
            data: { status: "ARCHIVED" },
          });
          await tx.auditLog.create({
            data: {
              tenantId: input.tenantId,
              actorType: "USER",
              actorUserId: input.userId,
              action: "course.archived",
              resourceType: "course",
              resourceId: course.id,
              requestId: input.requestId,
              metadata: { reason: "delete_with_history" },
            },
          });
          return { id: course.id, deleted: false, archived: true };
        }

        await tx.courseVersion.deleteMany({ where: { courseId: course.id } });
        await tx.course.delete({ where: { id: course.id } });
        await tx.auditLog.create({
          data: {
            tenantId: input.tenantId,
            actorType: "USER",
            actorUserId: input.userId,
            action: "course.deleted",
            resourceType: "course",
            resourceId: course.id,
            requestId: input.requestId,
          },
        });

        return { id: course.id, deleted: true, archived: false };
      },
    );
  }

  private async transition(
    input: { tenantId: string; userId: string; requestId: string; courseId: string },
    options: {
      from: CourseStatus[];
      to: CourseStatus;
      versionTo: "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
      action: string;
      invalidMessage: string;
      archiveAllVersions?: boolean;
    },
  ): Promise<CourseDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const course = await tx.course.findFirst({
          where: { id: input.courseId },
          include: { versions: { orderBy: { version: "desc" }, take: 1 } },
        });
        if (!course) {
          throw new NotFoundException({
            code: "COURSE_NOT_FOUND",
            message: "Curso não encontrado.",
          });
        }

        if (!options.from.includes(course.status)) {
          throw new BadRequestException({
            code: "COURSE_INVALID_TRANSITION",
            message: options.invalidMessage,
          });
        }

        if (options.archiveAllVersions) {
          await tx.courseVersion.updateMany({
            where: { courseId: course.id },
            data: { status: options.versionTo },
          });
        } else if (course.versions[0]) {
          await tx.courseVersion.update({
            where: { id: course.versions[0].id },
            data: { status: options.versionTo },
          });
        }

        const updated = await tx.course.update({
          where: { id: course.id },
          data: { status: options.to },
          include: versionInclude,
        });

        await tx.auditLog.create({
          data: {
            tenantId: input.tenantId,
            actorType: "USER",
            actorUserId: input.userId,
            action: options.action,
            resourceType: "course",
            resourceId: course.id,
            requestId: input.requestId,
            beforeData: { status: course.status },
            afterData: { status: options.to },
          },
        });

        return mapCourse(updated);
      },
    );
  }

  private resolveOrderBy(
    sort?: ListCoursesInput["sort"],
  ): Prisma.CourseOrderByWithRelationInput {
    switch (sort) {
      case "createdAt_asc":
        return { createdAt: "asc" };
      case "title_asc":
        return { title: "asc" };
      case "title_desc":
        return { title: "desc" };
      case "updatedAt_desc":
        return { updatedAt: "desc" };
      case "createdAt_desc":
      default:
        return { createdAt: "desc" };
    }
  }
}

export type { CourseListItemDto };
