import type {
  CourseDto,
  CourseListItemDto,
  CourseStatusCode,
  CourseVersionSummaryDto,
  CourseVisibilityCode,
} from "@eduvy/contracts";

type VersionRow = {
  id: string;
  version: number;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  category: string | null;
  workloadMinutes: number | null;
  thumbnailFileId: string | null;
  visibility: string;
  status: string;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  versions?: VersionRow[];
  _count?: { versions: number };
};

export function mapVersion(version: VersionRow): CourseVersionSummaryDto {
  return {
    id: version.id,
    version: version.version,
    status: version.status as CourseStatusCode,
    publishedAt: version.publishedAt?.toISOString() ?? null,
    createdAt: version.createdAt.toISOString(),
    updatedAt: version.updatedAt.toISOString(),
  };
}

export function pickCurrentVersion(versions: VersionRow[] = []): VersionRow | null {
  if (versions.length === 0) return null;

  const published = versions
    .filter((item) => item.status === "PUBLISHED")
    .sort((a, b) => b.version - a.version)[0];
  if (published) return published;

  return [...versions].sort((a, b) => b.version - a.version)[0] ?? null;
}

export function mapCourseListItem(course: CourseRow): CourseListItemDto {
  const current = pickCurrentVersion(course.versions);
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    shortDescription: course.shortDescription,
    category: course.category,
    workloadMinutes: course.workloadMinutes,
    visibility: course.visibility as CourseVisibilityCode,
    status: course.status as CourseStatusCode,
    ownerId: course.ownerId,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    currentVersion: current ? mapVersion(current) : null,
  };
}

export function mapCourse(course: CourseRow): CourseDto {
  const current = pickCurrentVersion(course.versions);
  return {
    ...mapCourseListItem(course),
    description: course.description,
    thumbnailFileId: course.thumbnailFileId,
    versionsCount: course._count?.versions ?? course.versions?.length ?? 0,
    currentVersion: current ? mapVersion(current) : null,
  };
}
