import type {
  CourseModuleDto,
  CourseStructureDto,
  LessonContentDto,
  LessonDto,
} from "@eduvy/contracts";

type ContentRow = {
  id: string;
  type: string;
  sortOrder: number;
  textContent: string | null;
  fileId: string | null;
  externalUrl: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
};

type LessonRow = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  sortOrder: number;
  estimatedMinutes: number | null;
  isRequired: boolean;
  isPreview: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  contents?: ContentRow[];
};

type ModuleRow = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  isRequired: boolean;
  estimatedMinutes: number | null;
  createdAt: Date;
  updatedAt: Date;
  lessons?: LessonRow[];
};

export function mapLessonContent(row: ContentRow): LessonContentDto {
  return {
    id: row.id,
    type: row.type as LessonContentDto["type"],
    sortOrder: row.sortOrder,
    textContent: row.textContent,
    fileId: row.fileId,
    externalUrl: row.externalUrl,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapLesson(row: LessonRow): LessonDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type as LessonDto["type"],
    sortOrder: row.sortOrder,
    estimatedMinutes: row.estimatedMinutes,
    isRequired: row.isRequired,
    isPreview: row.isPreview,
    status: row.status,
    contents: (row.contents ?? []).map(mapLessonContent),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapModule(row: ModuleRow): CourseModuleDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    sortOrder: row.sortOrder,
    isRequired: row.isRequired,
    estimatedMinutes: row.estimatedMinutes,
    lessons: (row.lessons ?? []).map(mapLesson),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapStructure(input: {
  courseId: string;
  versionId: string;
  version: number;
  versionStatus: string;
  editable: boolean;
  modules: ModuleRow[];
}): CourseStructureDto {
  return {
    courseId: input.courseId,
    versionId: input.versionId,
    version: input.version,
    versionStatus: input.versionStatus as CourseStructureDto["versionStatus"],
    editable: input.editable,
    modules: input.modules.map(mapModule),
  };
}

const structureInclude = {
  modules: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      lessons: {
        orderBy: { sortOrder: "asc" as const },
        include: {
          contents: { orderBy: { sortOrder: "asc" as const } },
        },
      },
    },
  },
};

export { structureInclude };
