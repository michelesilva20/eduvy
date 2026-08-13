export interface ApiErrorBody {
  type: string;
  code: string;
  message: string;
  requestId: string;
  details?: Array<{ field?: string; message: string }>;
}

export interface PaginatedMeta {
  hasMore: boolean;
  nextCursor?: string | null;
}

export interface HealthResponse {
  status: "ok" | "degraded" | "down";
  service: string;
  timestamp: string;
}

export const PERMISSIONS = {
  TENANT_READ: "tenant.read",
  TENANT_UPDATE: "tenant.update",
  MEMBERS_READ: "members.read",
  MEMBERS_INVITE: "members.invite",
  COURSES_READ: "courses.read",
  COURSES_CREATE: "courses.create",
  COURSES_UPDATE: "courses.update",
  COURSES_PUBLISH: "courses.publish",
  COURSES_DELETE: "courses.delete",
  COURSE_CONTENT_READ: "course_content.read",
  COURSE_CONTENT_MANAGE: "course_content.manage",
  STUDENTS_READ: "students.read",
  STUDENTS_MANAGE: "students.manage",
  INSTRUCTORS_READ: "instructors.read",
  INSTRUCTORS_MANAGE: "instructors.manage",
  COHORTS_READ: "cohorts.read",
  COHORTS_CREATE: "cohorts.create",
  COHORTS_UPDATE: "cohorts.update",
  COHORTS_MANAGE_STUDENTS: "cohorts.manage_students",
  ENROLLMENTS_READ: "enrollments.read",
  ENROLLMENTS_CREATE: "enrollments.create",
  ENROLLMENTS_CANCEL: "enrollments.cancel",
  LEARNING_PROGRESS_READ: "learning_progress.read",
  QUESTIONS_READ: "questions.read",
  QUESTIONS_MANAGE: "questions.manage",
  ASSESSMENTS_READ: "assessments.read",
  ASSESSMENTS_CREATE: "assessments.create",
  ASSESSMENTS_UPDATE: "assessments.update",
  ASSESSMENTS_PUBLISH: "assessments.publish",
  ASSESSMENTS_ATTEMPT: "assessments.attempt",
  AUDIT_READ: "audit.read",
  BILLING_READ: "billing.read",
  ENTITLEMENTS_READ: "entitlements.read",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const MODULE_CODES = {
  CORE_COURSES: "CORE_COURSES",
  ESSAYS: "ESSAYS",
  SIMULATIONS: "SIMULATIONS",
  QUESTION_BANK: "QUESTION_BANK",
  FORUM: "FORUM",
  GAMIFICATION: "GAMIFICATION",
  CERTIFICATES: "CERTIFICATES",
  ADVANCED_ANALYTICS: "ADVANCED_ANALYTICS",
  INTEGRATIONS: "INTEGRATIONS",
  API_ACCESS: "API_ACCESS",
} as const;

export type ModuleCode = (typeof MODULE_CODES)[keyof typeof MODULE_CODES];

export const QUEUE_NAMES = {
  EMAIL: "email",
  NOTIFICATIONS: "notifications",
  CERTIFICATES: "certificates",
  MEDIA_PROCESSING: "media-processing",
  FILE_SCANNING: "file-scanning",
  IMPORTS: "imports",
  EXPORTS: "exports",
  ANALYTICS: "analytics",
  WEBHOOKS: "webhooks",
  BILLING: "billing",
  MAINTENANCE: "maintenance",
  OUTBOX: "outbox",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const AUTH_COOKIES = {
  ACCESS: "eduvy_access",
  REFRESH: "eduvy_refresh",
  SESSION: "eduvy_session",
  CSRF: "eduvy_csrf",
  TENANT: "eduvy_tenant",
} as const;

export const AUTH_HEADERS = {
  CSRF: "x-csrf-token",
  BFF_SECRET: "x-eduvy-bff-secret",
  TENANT_ID: "x-eduvy-tenant-id",
} as const;

export const COURSE_STATUSES = {
  DRAFT: "DRAFT",
  IN_REVIEW: "IN_REVIEW",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

export type CourseStatusCode = (typeof COURSE_STATUSES)[keyof typeof COURSE_STATUSES];

export const COURSE_VISIBILITIES = {
  PRIVATE: "PRIVATE",
  TENANT: "TENANT",
  UNLISTED: "UNLISTED",
} as const;

export type CourseVisibilityCode =
  (typeof COURSE_VISIBILITIES)[keyof typeof COURSE_VISIBILITIES];

export interface CourseVersionSummaryDto {
  id: string;
  version: number;
  status: CourseStatusCode;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseDto {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  category: string | null;
  workloadMinutes: number | null;
  thumbnailFileId: string | null;
  visibility: CourseVisibilityCode;
  status: CourseStatusCode;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  currentVersion: CourseVersionSummaryDto | null;
  versionsCount: number;
}

export interface CourseListItemDto {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  category: string | null;
  workloadMinutes: number | null;
  visibility: CourseVisibilityCode;
  status: CourseStatusCode;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  currentVersion: CourseVersionSummaryDto | null;
}

export interface PaginatedCoursesDto {
  items: CourseListItemDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export const LESSON_TYPES = {
  VIDEO: "VIDEO",
  TEXT: "TEXT",
  DOCUMENT: "DOCUMENT",
  LINK: "LINK",
} as const;

export type LessonTypeCode = (typeof LESSON_TYPES)[keyof typeof LESSON_TYPES];

export const LESSON_CONTENT_TYPES = {
  RICH_TEXT: "RICH_TEXT",
  VIDEO: "VIDEO",
  FILE: "FILE",
  IMAGE: "IMAGE",
  LINK: "LINK",
  EMBED: "EMBED",
} as const;

export type LessonContentTypeCode =
  (typeof LESSON_CONTENT_TYPES)[keyof typeof LESSON_CONTENT_TYPES];

export interface LessonContentDto {
  id: string;
  type: LessonContentTypeCode;
  sortOrder: number;
  textContent: string | null;
  fileId: string | null;
  externalUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface LessonDto {
  id: string;
  title: string;
  description: string | null;
  type: LessonTypeCode;
  sortOrder: number;
  estimatedMinutes: number | null;
  isRequired: boolean;
  isPreview: boolean;
  status: string;
  contents: LessonContentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseModuleDto {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  isRequired: boolean;
  estimatedMinutes: number | null;
  lessons: LessonDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseStructureDto {
  courseId: string;
  versionId: string;
  version: number;
  versionStatus: CourseStatusCode;
  editable: boolean;
  modules: CourseModuleDto[];
}

export interface AuthUserDto {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthLoginResponseDto {
  user: AuthUserDto;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
  csrfToken: string;
}

export interface AuthSessionResponseDto {
  user: AuthUserDto;
  sessionId: string;
}

export interface TenantSummaryDto {
  id: string;
  name: string;
  slug: string;
  planName: string | null;
  roleName: string | null;
  membershipId: string;
}

export interface TenantContextDto {
  activeTenant: TenantSummaryDto | null;
  tenants: TenantSummaryDto[];
}

export const MEMBERSHIP_STATUSES = {
  INVITED: "INVITED",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  REMOVED: "REMOVED",
} as const;

export type MembershipStatusCode =
  (typeof MEMBERSHIP_STATUSES)[keyof typeof MEMBERSHIP_STATUSES];

export const TENANT_ROLE_CODES = {
  TENANT_OWNER: "TENANT_OWNER",
  STUDENT: "STUDENT",
  INSTRUCTOR: "INSTRUCTOR",
  ACADEMIC_MANAGER: "ACADEMIC_MANAGER",
} as const;

export type TenantRoleCode = (typeof TENANT_ROLE_CODES)[keyof typeof TENANT_ROLE_CODES];

export interface PersonListItemDto {
  membershipId: string;
  userId: string;
  fullName: string;
  email: string;
  status: MembershipStatusCode;
  roles: string[];
  joinedAt: string | null;
  cohortsCount: number;
  activeCoursesCount: number;
  progressPercent: number | null;
}

export interface PersonDetailDto extends PersonListItemDto {
  invitedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPeopleDto {
  items: PersonListItemDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export const INVITATION_STATUSES = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
} as const;

export type InvitationStatusCode =
  (typeof INVITATION_STATUSES)[keyof typeof INVITATION_STATUSES];

export interface InvitationListItemDto {
  id: string;
  email: string;
  status: InvitationStatusCode;
  roles: string[];
  expiresAt: string;
  createdAt: string;
  lastSentAt: string | null;
}

export interface PaginatedInvitationsDto {
  items: InvitationListItemDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface CreateInvitationResponseDto {
  invitation: InvitationListItemDto;
  inviteToken: string;
}

export const COHORT_STATUSES = {
  DRAFT: "DRAFT",
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  ARCHIVED: "ARCHIVED",
} as const;

export type CohortStatusCode = (typeof COHORT_STATUSES)[keyof typeof COHORT_STATUSES];

export const COHORT_INSTRUCTOR_ROLES = {
  LEAD: "LEAD",
  ASSISTANT: "ASSISTANT",
  TUTOR: "TUTOR",
} as const;

export type CohortInstructorRoleCode =
  (typeof COHORT_INSTRUCTOR_ROLES)[keyof typeof COHORT_INSTRUCTOR_ROLES];

export interface CohortInstructorDto {
  id: string;
  membershipId: string;
  userId: string;
  fullName: string;
  email: string;
  role: CohortInstructorRoleCode;
  assignedAt: string;
}

export interface CohortListItemDto {
  id: string;
  name: string;
  code: string | null;
  status: CohortStatusCode;
  courseId: string;
  courseTitle: string;
  courseVersionId: string;
  courseVersion: number;
  startsAt: string | null;
  endsAt: string | null;
  maxStudents: number | null;
  studentsCount: number;
  instructorsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CohortDto extends CohortListItemDto {
  enrollmentStartAt: string | null;
  enrollmentEndAt: string | null;
  createdBy: string | null;
  instructors: CohortInstructorDto[];
}

export interface PaginatedCohortsDto {
  items: CohortListItemDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export const ENROLLMENT_STATUSES = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
} as const;

export type EnrollmentStatusCode =
  (typeof ENROLLMENT_STATUSES)[keyof typeof ENROLLMENT_STATUSES];

export interface EnrollmentDto {
  id: string;
  cohortId: string;
  membershipId: string;
  courseVersionId: string;
  status: EnrollmentStatusCode;
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  studentFullName: string;
  studentEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedEnrollmentsDto {
  items: EnrollmentDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface BulkEnrollmentResultDto {
  enrolled: number;
  alreadyEnrolled: number;
  failed: number;
  results: Array<{
    membershipId: string;
    status: "enrolled" | "already_enrolled" | "failed";
    enrollmentId?: string;
    message?: string;
  }>;
}

export const LESSON_PROGRESS_STATUSES = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type LessonProgressStatusCode =
  (typeof LESSON_PROGRESS_STATUSES)[keyof typeof LESSON_PROGRESS_STATUSES];

export interface LessonProgressDto {
  lessonId: string;
  status: LessonProgressStatusCode;
  progressPercentage: number;
  startedAt: string | null;
  completedAt: string | null;
  lastAccessAt: string | null;
  timeSpentSeconds: number;
}

export interface MyCourseDto {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  cohortId: string;
  cohortName: string;
  status: EnrollmentStatusCode;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessAt: string | null;
  leadInstructorName: string | null;
}

export interface PlayerLessonDto {
  id: string;
  title: string;
  type: LessonTypeCode;
  sortOrder: number;
  progress: LessonProgressDto;
  contents: LessonContentDto[];
}

export interface PlayerModuleDto {
  id: string;
  title: string;
  sortOrder: number;
  lessons: PlayerLessonDto[];
}

export interface PlayerStateDto {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  cohortName: string;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  currentLessonId: string | null;
  modules: PlayerModuleDto[];
}

/** Filtro agregado de progresso na turma (Gate 7). */
export const COHORT_PROGRESS_FILTERS = {
  ALL: "ALL",
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type CohortProgressFilterCode =
  (typeof COHORT_PROGRESS_FILTERS)[keyof typeof COHORT_PROGRESS_FILTERS];

export interface CohortStudentProgressDto {
  enrollmentId: string;
  membershipId: string;
  studentFullName: string;
  studentEmail: string;
  enrollmentStatus: EnrollmentStatusCode;
  progressStatus: Exclude<CohortProgressFilterCode, "ALL">;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessAt: string | null;
}

export interface PaginatedCohortProgressDto {
  cohortId: string;
  studentsCount: number;
  items: CohortStudentProgressDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export const QUESTION_TYPES = {
  SINGLE_CHOICE: "SINGLE_CHOICE",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE",
  SHORT_TEXT: "SHORT_TEXT",
} as const;

export type QuestionTypeCode = (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];

export const ASSESSMENT_STATUSES = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

export type AssessmentStatusCode =
  (typeof ASSESSMENT_STATUSES)[keyof typeof ASSESSMENT_STATUSES];

export interface QuestionOptionDto {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionDto {
  id: string;
  stem: string;
  type: QuestionTypeCode;
  options: QuestionOptionDto[] | null;
  correctAnswer: Record<string, unknown> | null;
  explanation: string | null;
  points: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedQuestionsDto {
  items: QuestionDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface AssessmentQuestionItemDto {
  id: string;
  questionId: string;
  sortOrder: number;
  pointsOverride: number | null;
  question: QuestionDto;
}

export interface AssessmentListItemDto {
  id: string;
  title: string;
  status: AssessmentStatusCode;
  questionsCount: number;
  passingScore: number | null;
  maxAttempts: number | null;
  timeLimitMinutes: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentDto extends AssessmentListItemDto {
  description: string | null;
  shuffleQuestions: boolean;
  availableFrom: string | null;
  availableUntil: string | null;
  createdBy: string | null;
  questions: AssessmentQuestionItemDto[];
}

export interface PaginatedAssessmentsDto {
  items: AssessmentListItemDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export const ATTEMPT_STATUSES = {
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
  GRADED: "GRADED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
} as const;

export type AttemptStatusCode =
  (typeof ATTEMPT_STATUSES)[keyof typeof ATTEMPT_STATUSES];

/** Public option — never includes isCorrect. */
export interface StudentQuestionOptionDto {
  id: string;
  text: string;
}

/** Player-safe question — no answer key / explanation / correctAnswer. */
export interface StudentQuestionDto {
  id: string;
  stem: string;
  type: QuestionTypeCode;
  options: StudentQuestionOptionDto[] | null;
  points: number;
  sortOrder: number;
  pointsOverride: number | null;
}

export interface AttemptAnswerDto {
  questionId: string;
  selectedOptionIds: string[];
  textAnswer: string | null;
  answeredAt: string | null;
}

export interface AssessmentAttemptDto {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  membershipId: string;
  enrollmentId: string | null;
  attemptNumber: number;
  status: AttemptStatusCode;
  startedAt: string;
  expiresAt: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  score: number | null;
  maxScore: number | null;
  scorePercentage: number | null;
  serverNow: string;
  questions: StudentQuestionDto[];
  answers: AttemptAnswerDto[];
  answeredCount: number;
  questionsCount: number;
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
  attemptsUsed: number;
  pendingManualGrade: boolean;
}

export interface AvailableAssessmentDto {
  id: string;
  title: string;
  description: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
  attemptsUsed: number;
  attemptsRemaining: number | null;
  questionsCount: number;
  currentAttemptId: string | null;
  currentAttemptStatus: AttemptStatusCode | null;
}

export interface StudentAttemptResultDto {
  attemptId: string;
  assessmentId: string;
  assessmentTitle: string;
  status: AttemptStatusCode;
  attemptNumber: number;
  maxAttempts: number | null;
  score: number | null;
  maxScore: number | null;
  scorePercentage: number | null;
  submittedAt: string | null;
  gradedAt: string | null;
  pendingManualGrade: boolean;
  passed: boolean | null;
  passingScore: number | null;
}
