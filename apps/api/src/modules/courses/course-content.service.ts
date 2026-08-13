import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CourseModuleDto,
  CourseStructureDto,
  LessonContentDto,
  LessonContentTypeCode,
  LessonDto,
  LessonTypeCode,
} from "@eduvy/contracts";
import {
  CourseStatus,
  LessonContentType,
  LessonType,
  TenantDatabase,
  type TransactionClient,
} from "@eduvy/database";
import { InjectTenantDb } from "../../common/database/database.module";
import { mapLesson, mapModule, mapStructure, structureInclude } from "./course-content.mapper";

type TenantCtx = { tenantId: string; userId: string; requestId: string };

@Injectable()
export class CourseContentService {
  constructor(@InjectTenantDb() private readonly tenantDb: TenantDatabase) {}

  async getStructure(input: TenantCtx & { courseId: string }): Promise<CourseStructureDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => this.loadStructure(tx, input.courseId),
    );
  }

  async createModule(
    input: TenantCtx & {
      courseId: string;
      title: string;
      description?: string;
      isRequired?: boolean;
      estimatedMinutes?: number;
    },
  ): Promise<CourseStructureDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const version = await this.resolveEditableVersion(tx, input.courseId);
        const maxOrder = await tx.courseModule.aggregate({
          where: { courseVersionId: version.id },
          _max: { sortOrder: true },
        });

        await tx.courseModule.create({
          data: {
            tenantId: input.tenantId,
            courseVersionId: version.id,
            title: input.title.trim(),
            description: input.description?.trim() || null,
            isRequired: input.isRequired ?? true,
            estimatedMinutes: input.estimatedMinutes ?? null,
            sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
          },
        });

        await this.audit(tx, input, "course_module.created", "course_module", version.id);
        return this.loadStructure(tx, input.courseId);
      },
    );
  }

  async updateModule(
    input: TenantCtx & {
      courseId: string;
      moduleId: string;
      title?: string;
      description?: string | null;
      isRequired?: boolean;
      estimatedMinutes?: number | null;
    },
  ): Promise<CourseModuleDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const version = await this.resolveEditableVersion(tx, input.courseId);
        const mod = await this.getModuleInVersion(tx, version.id, input.moduleId);

        const updated = await tx.courseModule.update({
          where: { id: mod.id },
          data: {
            title: input.title?.trim(),
            description: input.description === undefined ? undefined : input.description,
            isRequired: input.isRequired,
            estimatedMinutes:
              input.estimatedMinutes === undefined ? undefined : input.estimatedMinutes,
          },
          include: {
            lessons: {
              orderBy: { sortOrder: "asc" },
              include: { contents: { orderBy: { sortOrder: "asc" } } },
            },
          },
        });

        return mapModule(updated);
      },
    );
  }

  async deleteModule(input: TenantCtx & { courseId: string; moduleId: string }): Promise<CourseStructureDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const version = await this.resolveEditableVersion(tx, input.courseId);
        const mod = await this.getModuleInVersion(tx, version.id, input.moduleId);

        const lessons = await tx.lesson.findMany({
          where: { courseModuleId: mod.id },
          select: { id: true },
        });
        const lessonIds = lessons.map((l) => l.id);
        if (lessonIds.length > 0) {
          await tx.lessonContent.deleteMany({ where: { lessonId: { in: lessonIds } } });
          await tx.lesson.deleteMany({ where: { id: { in: lessonIds } } });
        }
        await tx.courseModule.delete({ where: { id: mod.id } });

        return this.loadStructure(tx, input.courseId);
      },
    );
  }

  async reorderModules(
    input: TenantCtx & { courseId: string; orderedIds: string[] },
  ): Promise<CourseStructureDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const version = await this.resolveEditableVersion(tx, input.courseId);
        await this.applyReorder(tx, "courseModule", version.id, input.orderedIds);
        return this.loadStructure(tx, input.courseId);
      },
    );
  }

  async createLesson(
    input: TenantCtx & {
      courseId: string;
      moduleId: string;
      title: string;
      description?: string;
      type?: LessonTypeCode;
      isRequired?: boolean;
      isPreview?: boolean;
      estimatedMinutes?: number;
    },
  ): Promise<CourseStructureDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const version = await this.resolveEditableVersion(tx, input.courseId);
        const mod = await this.getModuleInVersion(tx, version.id, input.moduleId);
        const maxOrder = await tx.lesson.aggregate({
          where: { courseModuleId: mod.id },
          _max: { sortOrder: true },
        });

        const lesson = await tx.lesson.create({
          data: {
            tenantId: input.tenantId,
            courseModuleId: mod.id,
            title: input.title.trim(),
            description: input.description?.trim() || null,
            type: (input.type as LessonType | undefined) ?? LessonType.TEXT,
            isRequired: input.isRequired ?? true,
            isPreview: input.isPreview ?? false,
            estimatedMinutes: input.estimatedMinutes ?? null,
            sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
          },
        });

        await tx.lessonContent.create({
          data: {
            tenantId: input.tenantId,
            lessonId: lesson.id,
            type: LessonContentType.RICH_TEXT,
            sortOrder: 0,
            textContent: "",
          },
        });

        return this.loadStructure(tx, input.courseId);
      },
    );
  }

  async updateLesson(
    input: TenantCtx & {
      courseId: string;
      lessonId: string;
      title?: string;
      description?: string | null;
      type?: LessonTypeCode;
      isRequired?: boolean;
      isPreview?: boolean;
      estimatedMinutes?: number | null;
    },
  ): Promise<LessonDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        await this.resolveEditableVersion(tx, input.courseId);
        const lesson = await this.getLessonInCourse(tx, input.courseId, input.lessonId);

        const updated = await tx.lesson.update({
          where: { id: lesson.id },
          data: {
            title: input.title?.trim(),
            description: input.description === undefined ? undefined : input.description,
            type: input.type as LessonType | undefined,
            isRequired: input.isRequired,
            isPreview: input.isPreview,
            estimatedMinutes:
              input.estimatedMinutes === undefined ? undefined : input.estimatedMinutes,
          },
          include: {
            contents: { orderBy: { sortOrder: "asc" } },
          },
        });

        return mapLesson(updated);
      },
    );
  }

  async deleteLesson(input: TenantCtx & { courseId: string; lessonId: string }): Promise<CourseStructureDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        await this.resolveEditableVersion(tx, input.courseId);
        const lesson = await this.getLessonInCourse(tx, input.courseId, input.lessonId);
        await tx.lessonContent.deleteMany({ where: { lessonId: lesson.id } });
        await tx.lesson.delete({ where: { id: lesson.id } });
        return this.loadStructure(tx, input.courseId);
      },
    );
  }

  async reorderLessons(
    input: TenantCtx & { courseId: string; moduleId: string; orderedIds: string[] },
  ): Promise<CourseStructureDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const version = await this.resolveEditableVersion(tx, input.courseId);
        const mod = await this.getModuleInVersion(tx, version.id, input.moduleId);
        await this.applyReorder(tx, "lesson", mod.id, input.orderedIds);
        return this.loadStructure(tx, input.courseId);
      },
    );
  }

  async updateContent(
    input: TenantCtx & {
      courseId: string;
      lessonId: string;
      contentId: string;
      type?: LessonContentTypeCode;
      textContent?: string | null;
      externalUrl?: string | null;
      fileId?: string | null;
    },
  ): Promise<LessonContentDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        await this.resolveEditableVersion(tx, input.courseId);
        await this.getLessonInCourse(tx, input.courseId, input.lessonId);

        const content = await tx.lessonContent.findFirst({
          where: { id: input.contentId, lessonId: input.lessonId },
        });
        if (!content) {
          throw new NotFoundException({
            code: "LESSON_CONTENT_NOT_FOUND",
            message: "Conteúdo não encontrado.",
          });
        }

        const updated = await tx.lessonContent.update({
          where: { id: content.id },
          data: {
            type: input.type as LessonContentType | undefined,
            textContent: input.textContent === undefined ? undefined : input.textContent,
            externalUrl: input.externalUrl === undefined ? undefined : input.externalUrl,
            fileId: input.fileId === undefined ? undefined : input.fileId,
          },
        });

        return {
          id: updated.id,
          type: updated.type as LessonContentDto["type"],
          sortOrder: updated.sortOrder,
          textContent: updated.textContent,
          fileId: updated.fileId,
          externalUrl: updated.externalUrl,
          metadata: (updated.metadata as Record<string, unknown> | null) ?? null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      },
    );
  }

  async copyStructureFromVersion(
    tx: TransactionClient,
    tenantId: string,
    sourceVersionId: string,
    targetVersionId: string,
  ) {
    const modules = await tx.courseModule.findMany({
      where: { courseVersionId: sourceVersionId },
      orderBy: { sortOrder: "asc" },
      include: {
        lessons: {
          orderBy: { sortOrder: "asc" },
          include: { contents: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });

    for (const mod of modules) {
      const newMod = await tx.courseModule.create({
        data: {
          tenantId,
          courseVersionId: targetVersionId,
          title: mod.title,
          description: mod.description,
          sortOrder: mod.sortOrder,
          isRequired: mod.isRequired,
          estimatedMinutes: mod.estimatedMinutes,
        },
      });

      for (const lesson of mod.lessons) {
        const newLesson = await tx.lesson.create({
          data: {
            tenantId,
            courseModuleId: newMod.id,
            title: lesson.title,
            description: lesson.description,
            type: lesson.type,
            sortOrder: lesson.sortOrder,
            estimatedMinutes: lesson.estimatedMinutes,
            isRequired: lesson.isRequired,
            isPreview: lesson.isPreview,
            status: lesson.status,
          },
        });

        for (const content of lesson.contents) {
          await tx.lessonContent.create({
            data: {
              tenantId,
              lessonId: newLesson.id,
              type: content.type,
              sortOrder: content.sortOrder,
              textContent: content.textContent,
              fileId: content.fileId,
              externalUrl: content.externalUrl,
              metadata: content.metadata ?? undefined,
            },
          });
        }
      }
    }
  }

  private async loadStructure(tx: TransactionClient, courseId: string): Promise<CourseStructureDto> {
    const course = await tx.course.findFirst({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException({ code: "COURSE_NOT_FOUND", message: "Curso não encontrado." });
    }

    const editableVersion = await tx.courseVersion.findFirst({
      where: { courseId, status: { in: ["DRAFT", "IN_REVIEW"] } },
      orderBy: { version: "desc" },
      include: structureInclude,
    });

    const displayVersion =
      editableVersion ??
      (await tx.courseVersion.findFirst({
        where: { courseId },
        orderBy: { version: "desc" },
        include: structureInclude,
      }));

    if (!displayVersion) {
      throw new NotFoundException({
        code: "COURSE_VERSION_NOT_FOUND",
        message: "Versão do curso não encontrada.",
      });
    }

    return mapStructure({
      courseId,
      versionId: displayVersion.id,
      version: displayVersion.version,
      versionStatus: displayVersion.status,
      editable: Boolean(editableVersion),
      modules: displayVersion.modules,
    });
  }

  private async resolveEditableVersion(tx: TransactionClient, courseId: string) {
    const course = await tx.course.findFirst({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException({ code: "COURSE_NOT_FOUND", message: "Curso não encontrado." });
    }
    if (course.status === CourseStatus.ARCHIVED) {
      throw new BadRequestException({
        code: "COURSE_ARCHIVED",
        message: "Cursos arquivados não podem ser editados.",
      });
    }

    const version = await tx.courseVersion.findFirst({
      where: { courseId, status: { in: ["DRAFT", "IN_REVIEW"] } },
      orderBy: { version: "desc" },
    });

    if (!version) {
      throw new BadRequestException({
        code: "COURSE_NOT_EDITABLE",
        message:
          "Este curso já foi publicado. Duplique o curso para criar uma nova versão editável.",
      });
    }

    return version;
  }

  private async getModuleInVersion(tx: TransactionClient, versionId: string, moduleId: string) {
    const mod = await tx.courseModule.findFirst({
      where: { id: moduleId, courseVersionId: versionId },
    });
    if (!mod) {
      throw new NotFoundException({ code: "MODULE_NOT_FOUND", message: "Módulo não encontrado." });
    }
    return mod;
  }

  private async getLessonInCourse(tx: TransactionClient, courseId: string, lessonId: string) {
    const lesson = await tx.lesson.findFirst({
      where: {
        id: lessonId,
        courseModule: { courseVersion: { courseId } },
      },
    });
    if (!lesson) {
      throw new NotFoundException({ code: "LESSON_NOT_FOUND", message: "Aula não encontrada." });
    }
    return lesson;
  }

  private async applyReorder(
    tx: TransactionClient,
    entity: "courseModule" | "lesson",
    parentId: string,
    orderedIds: string[],
  ) {
    if (entity === "courseModule") {
      const existing = await tx.courseModule.findMany({
        where: { courseVersionId: parentId },
        select: { id: true },
      });
      this.validateReorderSet(existing.map((e) => e.id), orderedIds);
      for (let i = 0; i < orderedIds.length; i += 1) {
        await tx.courseModule.update({
          where: { id: orderedIds[i] },
          data: { sortOrder: i },
        });
      }
      return;
    }

    const existing = await tx.lesson.findMany({
      where: { courseModuleId: parentId },
      select: { id: true },
    });
    this.validateReorderSet(existing.map((e) => e.id), orderedIds);
    for (let i = 0; i < orderedIds.length; i += 1) {
      await tx.lesson.update({
        where: { id: orderedIds[i] },
        data: { sortOrder: i },
      });
    }
  }

  private validateReorderSet(existingIds: string[], orderedIds: string[]) {
    if (existingIds.length !== orderedIds.length) {
      throw new BadRequestException({
        code: "INVALID_REORDER",
        message: "Lista de reordenação incompleta ou inválida.",
      });
    }
    const set = new Set(existingIds);
    for (const id of orderedIds) {
      if (!set.has(id)) {
        throw new BadRequestException({
          code: "INVALID_REORDER",
          message: "Item de reordenação não pertence a este contexto.",
        });
      }
    }
  }

  private async audit(
    tx: TransactionClient,
    input: TenantCtx,
    action: string,
    resourceType: string,
    resourceId: string,
  ) {
    await tx.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actorType: "USER",
        actorUserId: input.userId,
        action,
        resourceType,
        resourceId,
        requestId: input.requestId,
      },
    });
  }
}
