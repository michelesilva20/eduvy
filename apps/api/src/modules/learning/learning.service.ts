import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CohortProgressFilterCode,
  CohortStudentProgressDto,
  LessonProgressDto,
  MyCourseDto,
  PaginatedCohortProgressDto,
  PlayerLessonDto,
  PlayerModuleDto,
  PlayerStateDto,
} from "@eduvy/contracts";
import {
  EnrollmentStatus,
  LessonProgressStatus,
  TenantDatabase,
  type TransactionClient,
} from "@eduvy/database";
import { InjectTenantDb } from "../../common/database/database.module";

type TenantCtx = { tenantId: string; userId: string; requestId: string };

function deriveProgressStatus(input: {
  progressPercentage: number;
  completedLessons: number;
  lastAccessAt: Date | null;
}): CohortStudentProgressDto["progressStatus"] {
  if (input.progressPercentage >= 100) return "COMPLETED";
  if (
    input.progressPercentage > 0 ||
    input.completedLessons > 0 ||
    input.lastAccessAt
  ) {
    return "IN_PROGRESS";
  }
  return "NOT_STARTED";
}

@Injectable()
export class LearningService {
  constructor(@InjectTenantDb() private readonly tenantDb: TenantDatabase) {}

  listCohortProgress(
    input: TenantCtx & {
      cohortId: string;
      filter?: CohortProgressFilterCode;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedCohortProgressDto> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 50));
    const skip = (page - 1) * limit;
    const filter = input.filter ?? "ALL";
    const search = input.search?.trim().toLowerCase();

    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const cohort = await tx.cohort.findFirst({ where: { id: input.cohortId } });
        if (!cohort) {
          throw new NotFoundException({
            code: "COHORT_NOT_FOUND",
            message: "Turma não encontrada.",
          });
        }

        const [totalLessons, enrollments] = await Promise.all([
          tx.lesson.count({
            where: { courseModule: { courseVersionId: cohort.courseVersionId } },
          }),
          tx.enrollment.findMany({
            where: {
              cohortId: cohort.id,
              status: {
                in: [
                  EnrollmentStatus.PENDING,
                  EnrollmentStatus.ACTIVE,
                  EnrollmentStatus.COMPLETED,
                ],
              },
            },
            include: { lessonProgress: true },
            orderBy: { enrolledAt: "desc" },
          }),
        ]);

        const membershipIds = enrollments.map((e) => e.membershipId);
        const memberships =
          membershipIds.length > 0
            ? await tx.membership.findMany({
                where: { id: { in: membershipIds } },
                include: { user: true },
              })
            : [];
        const membershipById = new Map(memberships.map((m) => [m.id, m]));

        const mapped: CohortStudentProgressDto[] = enrollments
          .map((enrollment) => {
            const membership = membershipById.get(enrollment.membershipId);
            if (!membership) return null;

            const completedLessons = enrollment.lessonProgress.filter(
              (p) => p.status === LessonProgressStatus.COMPLETED,
            ).length;
            const progressPercentage =
              totalLessons === 0
                ? 0
                : Math.min(100, Math.round((completedLessons / totalLessons) * 100));

            const lastAccessAt = enrollment.lessonProgress.reduce<Date | null>(
              (acc, p) => {
                if (!p.lastAccessAt) return acc;
                if (!acc || p.lastAccessAt > acc) return p.lastAccessAt;
                return acc;
              },
              null,
            );

            const progressStatus = deriveProgressStatus({
              progressPercentage,
              completedLessons,
              lastAccessAt,
            });

            return {
              enrollmentId: enrollment.id,
              membershipId: enrollment.membershipId,
              studentFullName: membership.user.fullName,
              studentEmail: membership.user.email,
              enrollmentStatus: enrollment.status as CohortStudentProgressDto["enrollmentStatus"],
              progressStatus,
              progressPercentage,
              completedLessons,
              totalLessons,
              lastAccessAt: lastAccessAt?.toISOString() ?? null,
            };
          })
          .filter((item): item is CohortStudentProgressDto => item !== null);

        const filtered = mapped.filter((item) => {
          if (filter !== "ALL" && item.progressStatus !== filter) return false;
          if (!search) return true;
          return (
            item.studentFullName.toLowerCase().includes(search) ||
            item.studentEmail.toLowerCase().includes(search)
          );
        });

        const total = filtered.length;
        const items = filtered.slice(skip, skip + limit);

        return {
          cohortId: cohort.id,
          studentsCount: mapped.length,
          items,
          meta: {
            page,
            limit,
            total,
            hasMore: skip + items.length < total,
          },
        };
      },
    );
  }

  listMyCourses(input: TenantCtx): Promise<MyCourseDto[]> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const membership = await tx.membership.findFirst({
          where: { userId: input.userId, status: "ACTIVE" },
        });
        if (!membership) return [];

        const enrollments = await tx.enrollment.findMany({
          where: {
            membershipId: membership.id,
            status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] },
          },
          include: {
            cohort: {
              include: {
                course: { select: { id: true, title: true } },
                instructors: { where: { role: "LEAD" }, take: 1 },
              },
            },
            lessonProgress: true,
            courseVersion: {
              include: {
                modules: { include: { lessons: { select: { id: true } } } },
              },
            },
          },
          orderBy: { enrolledAt: "desc" },
        });

        const leadMembershipIds = enrollments
          .map((e) => e.cohort.instructors[0]?.membershipId)
          .filter(Boolean) as string[];
        const leadMemberships =
          leadMembershipIds.length > 0
            ? await tx.membership.findMany({
                where: { id: { in: leadMembershipIds } },
                include: { user: true },
              })
            : [];
        const leadByMembership = new Map(
          leadMemberships.map((m) => [m.id, m.user.fullName]),
        );

        return enrollments.map((enrollment) => {
          const lessonIds = enrollment.courseVersion.modules.flatMap((m) =>
            m.lessons.map((l) => l.id),
          );
          const totalLessons = lessonIds.length;
          const completedLessons = enrollment.lessonProgress.filter(
            (p) => p.status === LessonProgressStatus.COMPLETED,
          ).length;
          const progressPercentage =
            totalLessons === 0
              ? 0
              : Math.min(100, Math.round((completedLessons / totalLessons) * 100));

          const lastAccessAt = enrollment.lessonProgress.reduce<Date | null>((acc, p) => {
            if (!p.lastAccessAt) return acc;
            if (!acc || p.lastAccessAt > acc) return p.lastAccessAt;
            return acc;
          }, null);

          const leadId = enrollment.cohort.instructors[0]?.membershipId;

          return {
            enrollmentId: enrollment.id,
            courseId: enrollment.cohort.course.id,
            courseTitle: enrollment.cohort.course.title,
            cohortId: enrollment.cohortId,
            cohortName: enrollment.cohort.name,
            status: enrollment.status as MyCourseDto["status"],
            progressPercentage,
            completedLessons,
            totalLessons,
            lastAccessAt: lastAccessAt?.toISOString() ?? null,
            leadInstructorName: leadId ? leadByMembership.get(leadId) ?? null : null,
          };
        });
      },
    );
  }

  getPlayer(input: TenantCtx & { enrollmentId: string }): Promise<PlayerStateDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const enrollment = await this.requireOwnedEnrollment(tx, input);
        return this.buildPlayerState(tx, enrollment.id);
      },
    );
  }

  startLesson(
    input: TenantCtx & { enrollmentId: string; lessonId: string },
  ): Promise<PlayerStateDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const enrollment = await this.requireOwnedEnrollment(tx, input);
        await this.requireLessonInEnrollment(tx, enrollment.courseVersionId, input.lessonId);

        const existing = await tx.lessonProgress.findFirst({
          where: { enrollmentId: enrollment.id, lessonId: input.lessonId },
        });

        const now = new Date();
        if (!existing) {
          await tx.lessonProgress.create({
            data: {
              tenantId: input.tenantId,
              enrollmentId: enrollment.id,
              lessonId: input.lessonId,
              status: LessonProgressStatus.IN_PROGRESS,
              progressPercentage: 0,
              startedAt: now,
              lastAccessAt: now,
            },
          });
        } else if (existing.status !== LessonProgressStatus.COMPLETED) {
          await tx.lessonProgress.update({
            where: { id: existing.id },
            data: {
              status: LessonProgressStatus.IN_PROGRESS,
              startedAt: existing.startedAt ?? now,
              lastAccessAt: now,
            },
          });
        } else {
          await tx.lessonProgress.update({
            where: { id: existing.id },
            data: { lastAccessAt: now },
          });
        }

        if (!enrollment.startedAt) {
          await tx.enrollment.update({
            where: { id: enrollment.id },
            data: { startedAt: now },
          });
        }

        return this.buildPlayerState(tx, enrollment.id, input.lessonId);
      },
    );
  }

  completeLesson(
    input: TenantCtx & { enrollmentId: string; lessonId: string },
  ): Promise<PlayerStateDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const enrollment = await this.requireOwnedEnrollment(tx, input);
        await this.requireLessonInEnrollment(tx, enrollment.courseVersionId, input.lessonId);

        const existing = await tx.lessonProgress.findFirst({
          where: { enrollmentId: enrollment.id, lessonId: input.lessonId },
        });

        const now = new Date();
        if (!existing) {
          await tx.lessonProgress.create({
            data: {
              tenantId: input.tenantId,
              enrollmentId: enrollment.id,
              lessonId: input.lessonId,
              status: LessonProgressStatus.COMPLETED,
              progressPercentage: 100,
              startedAt: now,
              completedAt: now,
              lastAccessAt: now,
            },
          });
        } else if (existing.status !== LessonProgressStatus.COMPLETED) {
          await tx.lessonProgress.update({
            where: { id: existing.id },
            data: {
              status: LessonProgressStatus.COMPLETED,
              progressPercentage: 100,
              startedAt: existing.startedAt ?? now,
              completedAt: now,
              lastAccessAt: now,
            },
          });
        } else {
          // Idempotent: already completed — keep 100%, refresh access
          await tx.lessonProgress.update({
            where: { id: existing.id },
            data: {
              progressPercentage: 100,
              lastAccessAt: now,
            },
          });
        }

        const state = await this.buildPlayerState(tx, enrollment.id, input.lessonId);
        if (state.progressPercentage >= 100 && enrollment.status === EnrollmentStatus.ACTIVE) {
          await tx.enrollment.update({
            where: { id: enrollment.id },
            data: { status: EnrollmentStatus.COMPLETED, completedAt: now },
          });
        }

        return state;
      },
    );
  }

  private async requireOwnedEnrollment(
    tx: TransactionClient,
    input: TenantCtx & { enrollmentId: string },
  ) {
    const enrollment = await tx.enrollment.findFirst({
      where: { id: input.enrollmentId },
    });
    if (!enrollment) {
      throw new NotFoundException({
        code: "ENROLLMENT_NOT_FOUND",
        message: "Matrícula não encontrada.",
      });
    }

    const membership = await tx.membership.findFirst({
      where: { id: enrollment.membershipId },
    });
    if (!membership || membership.userId !== input.userId) {
      throw new ForbiddenException({
        code: "ENROLLMENT_FORBIDDEN",
        message: "Você não tem acesso a esta matrícula.",
      });
    }
    if (
      enrollment.status === EnrollmentStatus.CANCELLED ||
      enrollment.status === EnrollmentStatus.EXPIRED
    ) {
      throw new BadRequestException({
        code: "ENROLLMENT_INACTIVE",
        message: "Esta matrícula não está ativa.",
      });
    }
    return enrollment;
  }

  private async requireLessonInEnrollment(
    tx: TransactionClient,
    courseVersionId: string,
    lessonId: string,
  ) {
    const lesson = await tx.lesson.findFirst({
      where: {
        id: lessonId,
        courseModule: { courseVersionId },
      },
    });
    if (!lesson) {
      throw new NotFoundException({
        code: "LESSON_NOT_FOUND",
        message: "Aula não encontrada nesta matrícula.",
      });
    }
    return lesson;
  }

  private async buildPlayerState(
    tx: TransactionClient,
    enrollmentId: string,
    preferredLessonId?: string,
  ): Promise<PlayerStateDto> {
    const enrollment = await tx.enrollment.findFirstOrThrow({
      where: { id: enrollmentId },
      include: {
        cohort: { include: { course: true } },
        lessonProgress: true,
        courseVersion: {
          include: {
            modules: {
              orderBy: { sortOrder: "asc" },
              include: {
                lessons: {
                  orderBy: { sortOrder: "asc" },
                  include: { contents: { orderBy: { sortOrder: "asc" } } },
                },
              },
            },
          },
        },
      },
    });

    const progressByLesson = new Map(
      enrollment.lessonProgress.map((p) => [p.lessonId, p]),
    );

    const modules: PlayerModuleDto[] = enrollment.courseVersion.modules.map((mod) => ({
      id: mod.id,
      title: mod.title,
      sortOrder: mod.sortOrder,
      lessons: mod.lessons.map((lesson): PlayerLessonDto => {
        const progress = progressByLesson.get(lesson.id);
        const progressDto: LessonProgressDto = {
          lessonId: lesson.id,
          status: (progress?.status as LessonProgressDto["status"]) ?? "NOT_STARTED",
          progressPercentage: Math.min(100, Math.max(0, progress?.progressPercentage ?? 0)),
          startedAt: progress?.startedAt?.toISOString() ?? null,
          completedAt: progress?.completedAt?.toISOString() ?? null,
          lastAccessAt: progress?.lastAccessAt?.toISOString() ?? null,
          timeSpentSeconds: progress?.timeSpentSeconds ?? 0,
        };
        return {
          id: lesson.id,
          title: lesson.title,
          type: lesson.type as PlayerLessonDto["type"],
          sortOrder: lesson.sortOrder,
          progress: progressDto,
          contents: lesson.contents.map((c) => ({
            id: c.id,
            type: c.type as PlayerLessonDto["contents"][number]["type"],
            sortOrder: c.sortOrder,
            textContent: c.textContent,
            fileId: c.fileId,
            externalUrl: c.externalUrl,
            metadata: (c.metadata as Record<string, unknown> | null) ?? null,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
          })),
        };
      }),
    }));

    const allLessons = modules.flatMap((m) => m.lessons);
    const totalLessons = allLessons.length;
    const completedLessons = allLessons.filter(
      (l) => l.progress.status === "COMPLETED",
    ).length;
    const progressPercentage =
      totalLessons === 0
        ? 0
        : Math.min(100, Math.round((completedLessons / totalLessons) * 100));

    let currentLessonId =
      preferredLessonId && allLessons.some((l) => l.id === preferredLessonId)
        ? preferredLessonId
        : null;
    if (!currentLessonId) {
      currentLessonId =
        allLessons.find((l) => l.progress.status === "IN_PROGRESS")?.id ??
        allLessons.find((l) => l.progress.status !== "COMPLETED")?.id ??
        allLessons[0]?.id ??
        null;
    }

    return {
      enrollmentId: enrollment.id,
      courseId: enrollment.cohort.course.id,
      courseTitle: enrollment.cohort.course.title,
      cohortName: enrollment.cohort.name,
      progressPercentage,
      completedLessons,
      totalLessons,
      currentLessonId,
      modules,
    };
  }
}
