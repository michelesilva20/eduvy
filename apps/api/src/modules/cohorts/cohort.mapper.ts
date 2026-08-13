import type {
  CohortDto,
  CohortInstructorDto,
  CohortListItemDto,
  CohortStatusCode,
} from "@eduvy/contracts";
import type { Prisma } from "@eduvy/database";

type CohortRow = Prisma.CohortGetPayload<{
  include: {
    course: { select: { id: true; title: true } };
    courseVersion: { select: { id: true; version: true } };
    _count: { select: { enrollments: true; instructors: true } };
  };
}>;

type CohortDetailRow = Prisma.CohortGetPayload<{
  include: {
    course: { select: { id: true; title: true } };
    courseVersion: { select: { id: true; version: true } };
    _count: { select: { enrollments: true; instructors: true } };
    instructors: true;
  };
}>;

export function mapCohortListItem(row: CohortRow): CohortListItemDto {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    status: row.status as CohortStatusCode,
    courseId: row.courseId,
    courseTitle: row.course.title,
    courseVersionId: row.courseVersionId,
    courseVersion: row.courseVersion.version,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    maxStudents: row.maxStudents,
    studentsCount: row._count.enrollments,
    instructorsCount: row._count.instructors,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapCohortDetail(
  row: CohortDetailRow,
  instructors: CohortInstructorDto[],
): CohortDto {
  return {
    ...mapCohortListItem(row),
    enrollmentStartAt: row.enrollmentStartAt?.toISOString() ?? null,
    enrollmentEndAt: row.enrollmentEndAt?.toISOString() ?? null,
    createdBy: row.createdBy,
    instructors,
  };
}
