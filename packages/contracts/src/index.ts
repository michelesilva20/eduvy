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
  COURSES_PUBLISH: "courses.publish",
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
} as const;

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
