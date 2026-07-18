export type EntityStatus =
  | "active"
  | "inactive"
  | "draft"
  | "published"
  | "archived"
  | "pending";

export type TrendDirection = "up" | "down" | "neutral";

export interface Organization {
  id: string;
  name: string;
  plan: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarInitials: string;
}

export interface StatMetric {
  id: string;
  label: string;
  value: string | number;
  change: string;
  trend: TrendDirection;
  hint?: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export interface PendingAction {
  id: string;
  title: string;
  count: number;
  href: string;
  priority: "high" | "medium" | "low";
}

export interface Course {
  id: string;
  title: string;
  category: string;
  teacherName: string;
  teacherId: string;
  studentsCount: number;
  modulesCount: number;
  workloadHours: number;
  progressAvg: number;
  status: EntityStatus;
  modality: "online" | "hybrid" | "live";
  level: string;
  coverGradient: string;
  updatedAt: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
  teacherName: string;
  studentsCount: number;
  startDate: string;
  endDate: string;
  status: EntityStatus;
  progress: number;
  participation: number;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  className: string;
  coursesCount: number;
  lastAccess: string;
  progress: number;
  level: number;
  xp: number;
  status: EntityStatus;
  enrolledAt: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  specialty: string;
  avatarInitials: string;
  coursesCount: number;
  classesCount: number;
  studentsCount: number;
  pendingEssays: number;
  pendingAssessments: number;
  status: EntityStatus;
}

export interface PlatformModule {
  id: string;
  name: string;
  description: string;
  status: "active" | "available" | "locked" | "trial" | "included";
  category: string;
  isNew?: boolean;
  isRecommended?: boolean;
}

export interface ChartPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  time: string;
}

export interface JourneySnapshot {
  level: number;
  xp: number;
  xpToNext: number;
  nextAchievement: string;
  monthlyGoal: number;
  monthlyProgress: number;
}
