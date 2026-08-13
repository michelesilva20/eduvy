import type { EnrollmentDto } from "@eduvy/contracts";

export function mapEnrollment(row: {
  id: string;
  cohortId: string;
  membershipId: string;
  courseVersionId: string;
  status: string;
  enrolledAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  studentFullName: string;
  studentEmail: string;
}): EnrollmentDto {
  return {
    id: row.id,
    cohortId: row.cohortId,
    membershipId: row.membershipId,
    courseVersionId: row.courseVersionId,
    status: row.status as EnrollmentDto["status"],
    enrolledAt: row.enrolledAt.toISOString(),
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    studentFullName: row.studentFullName,
    studentEmail: row.studentEmail,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
