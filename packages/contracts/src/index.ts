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
