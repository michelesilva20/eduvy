import type {
  ActivityItem,
  ChartPoint,
  ClassGroup,
  Course,
  JourneySnapshot,
  NotificationItem,
  Organization,
  PendingAction,
  PlatformModule,
  PlatformUser,
  StatMetric,
  Student,
  Teacher,
} from "@/types/platform";

export const currentOrganization: Organization = {
  id: "org-1",
  name: "Preparatório Aurora",
  plan: "Profissional",
  level: 8,
  xp: 12450,
  xpToNextLevel: 15000,
};

export const currentUser: PlatformUser = {
  id: "user-1",
  name: "Michele Silva",
  email: "michele@preparatorioaurora.demo",
  role: "Administradora",
  avatarInitials: "MS",
};

export const dashboardStats: StatMetric[] = [
  { id: "1", label: "Alunos ativos", value: 1248, change: "+8,2%", trend: "up", hint: "Últimos 30 dias" },
  { id: "2", label: "Cursos publicados", value: 36, change: "+3", trend: "up", hint: "Total na organização" },
  { id: "3", label: "Turmas em andamento", value: 18, change: "Estável", trend: "neutral" },
  { id: "4", label: "Taxa de conclusão", value: "74%", change: "+5,1%", trend: "up" },
  { id: "5", label: "Engajamento médio", value: "88%", change: "+2,4%", trend: "up" },
  { id: "6", label: "Avaliações pendentes", value: 24, change: "Atenção", trend: "down" },
  { id: "7", label: "Redações aguardando", value: 12, change: "+4", trend: "down" },
  { id: "8", label: "Certificados emitidos", value: 156, change: "+18", trend: "up" },
];

export const journeySnapshot: JourneySnapshot = {
  level: 8,
  xp: 12450,
  xpToNext: 15000,
  nextAchievement: "Comunidade engajada — Nível 9",
  monthlyGoal: 85,
  monthlyProgress: 72,
};

export const activeStudentsChart: ChartPoint[] = [
  { label: "Jan", value: 980 },
  { label: "Fev", value: 1020 },
  { label: "Mar", value: 1080 },
  { label: "Abr", value: 1120 },
  { label: "Mai", value: 1180 },
  { label: "Jun", value: 1248 },
];

export const engagementChart: ChartPoint[] = [
  { label: "Sem 1", value: 82 },
  { label: "Sem 2", value: 85 },
  { label: "Sem 3", value: 79 },
  { label: "Sem 4", value: 88 },
  { label: "Sem 5", value: 91 },
  { label: "Sem 6", value: 88 },
];

export const completionChart: ChartPoint[] = [
  { label: "Jan", value: 62, secondary: 58 },
  { label: "Fev", value: 65, secondary: 60 },
  { label: "Mar", value: 68, secondary: 63 },
  { label: "Abr", value: 71, secondary: 66 },
  { label: "Mai", value: 73, secondary: 69 },
  { label: "Jun", value: 74, secondary: 70 },
];

export const recentActivities: ActivityItem[] = [
  { id: "a1", type: "student", title: "Novo aluno cadastrado", description: "Ana Beatriz entrou na Turma ENEM 2026", timestamp: "Há 12 min", icon: "user-plus" },
  { id: "a2", type: "course", title: "Curso publicado", description: "Interpretação avançada foi publicado", timestamp: "Há 1 h", icon: "book-open" },
  { id: "a3", type: "essay", title: "Redação enviada", description: "18 redações aguardam correção", timestamp: "Há 2 h", icon: "pen-line" },
  { id: "a4", type: "simulation", title: "Simulado finalizado", description: "Turma B concluiu simulado integrado", timestamp: "Há 4 h", icon: "clipboard-check" },
  { id: "a5", type: "certificate", title: "Certificado emitido", description: "6 certificados gerados hoje", timestamp: "Ontem", icon: "award" },
];

export const pendingActions: PendingAction[] = [
  { id: "p1", title: "Redações aguardando correção", count: 12, href: "/app/essays", priority: "high" },
  { id: "p2", title: "Avaliações sem nota", count: 24, href: "/app/assessments", priority: "high" },
  { id: "p3", title: "Cursos em rascunho", count: 4, href: "/app/courses", priority: "medium" },
  { id: "p4", title: "Alunos inativos", count: 38, href: "/app/students", priority: "medium" },
  { id: "p5", title: "Conteúdos incompletos", count: 7, href: "/app/content", priority: "low" },
];

export const mockCourses: Course[] = [
  { id: "c1", title: "Preparação ENEM — Linguagens", category: "Vestibular", teacherName: "Prof. Ricardo", teacherId: "t1", studentsCount: 320, modulesCount: 12, workloadHours: 48, progressAvg: 68, status: "published", modality: "online", level: "Intermediário", coverGradient: "from-primary/80 to-primary-bright/60", updatedAt: "17 jul 2026" },
  { id: "c2", title: "Redação Argumentativa", category: "Vestibular", teacherName: "Prof. Marina", teacherId: "t2", studentsCount: 280, modulesCount: 8, workloadHours: 32, progressAvg: 54, status: "published", modality: "hybrid", level: "Avançado", coverGradient: "from-secondary/70 to-primary/50", updatedAt: "16 jul 2026" },
  { id: "c3", title: "Matemática — Funções e Gráficos", category: "Reforço", teacherName: "Prof. Lucas", teacherId: "t3", studentsCount: 195, modulesCount: 10, workloadHours: 40, progressAvg: 72, status: "published", modality: "online", level: "Intermediário", coverGradient: "from-achievement/60 to-primary/40", updatedAt: "15 jul 2026" },
  { id: "c4", title: "Compliance Corporativo", category: "Corporativo", teacherName: "Prof. Fernanda", teacherId: "t4", studentsCount: 86, modulesCount: 6, workloadHours: 18, progressAvg: 91, status: "published", modality: "online", level: "Básico", coverGradient: "from-primary/60 to-secondary/50", updatedAt: "14 jul 2026" },
  { id: "c5", title: "Simulados Integrados 2026", category: "Vestibular", teacherName: "Prof. Ricardo", teacherId: "t1", studentsCount: 0, modulesCount: 4, workloadHours: 12, progressAvg: 0, status: "draft", modality: "online", level: "Avançado", coverGradient: "from-text-muted/30 to-primary/30", updatedAt: "13 jul 2026" },
];

export const mockClasses: ClassGroup[] = [
  { id: "cl1", name: "Turma ENEM 2026 — Manhã", courseId: "c1", courseName: "Preparação ENEM — Linguagens", teacherName: "Prof. Ricardo", studentsCount: 42, startDate: "03 fev 2026", endDate: "15 nov 2026", status: "active", progress: 68, participation: 91 },
  { id: "cl2", name: "Turma Redação — Intensivo", courseId: "c2", courseName: "Redação Argumentativa", teacherName: "Prof. Marina", studentsCount: 36, startDate: "10 mar 2026", endDate: "20 dez 2026", status: "active", progress: 54, participation: 88 },
  { id: "cl3", name: "Reforço Matemática 3º ano", courseId: "c3", courseName: "Matemática — Funções", teacherName: "Prof. Lucas", studentsCount: 28, startDate: "01 abr 2026", endDate: "30 set 2026", status: "active", progress: 72, participation: 85 },
];

export const mockStudents: Student[] = [
  { id: "s1", name: "Ana Beatriz Costa", email: "ana.costa@email.demo", avatarInitials: "AC", className: "Turma ENEM 2026", coursesCount: 3, lastAccess: "Hoje, 14:32", progress: 78, level: 12, xp: 4850, status: "active", enrolledAt: "12 jan 2026" },
  { id: "s2", name: "Bruno Henrique Lima", email: "bruno.lima@email.demo", avatarInitials: "BL", className: "Turma Redação", coursesCount: 2, lastAccess: "Ontem", progress: 62, level: 9, xp: 3200, status: "active", enrolledAt: "20 jan 2026" },
  { id: "s3", name: "Carla Mendes", email: "carla.m@email.demo", avatarInitials: "CM", className: "Reforço Matemática", coursesCount: 4, lastAccess: "Há 5 dias", progress: 45, level: 6, xp: 1800, status: "inactive", enrolledAt: "05 fev 2026" },
  { id: "s4", name: "Diego Alves", email: "diego.a@email.demo", avatarInitials: "DA", className: "Turma ENEM 2026", coursesCount: 3, lastAccess: "Hoje, 09:15", progress: 84, level: 14, xp: 5200, status: "active", enrolledAt: "08 jan 2026" },
];

export const mockTeachers: Teacher[] = [
  { id: "t1", name: "Prof. Ricardo Almeida", email: "ricardo@preparatorio.demo", specialty: "Linguagens e Redação", avatarInitials: "RA", coursesCount: 4, classesCount: 3, studentsCount: 320, pendingEssays: 8, pendingAssessments: 6, status: "active" },
  { id: "t2", name: "Prof. Marina Souza", email: "marina@preparatorio.demo", specialty: "Redação e Texto", avatarInitials: "MS", coursesCount: 2, classesCount: 2, studentsCount: 280, pendingEssays: 12, pendingAssessments: 4, status: "active" },
  { id: "t3", name: "Prof. Lucas Ferreira", email: "lucas@preparatorio.demo", specialty: "Matemática", avatarInitials: "LF", coursesCount: 3, classesCount: 2, studentsCount: 195, pendingEssays: 0, pendingAssessments: 8, status: "active" },
];

export const mockModules: PlatformModule[] = [
  { id: "m1", name: "Redações", description: "Envio, correção manual e assistida por IA.", status: "active", category: "Avaliação", isRecommended: true },
  { id: "m2", name: "Banco de questões", description: "Organize questões por matéria e dificuldade.", status: "active", category: "Avaliação" },
  { id: "m3", name: "Simulados", description: "Provas cronometradas com relatórios.", status: "active", category: "Avaliação" },
  { id: "m4", name: "Fórum", description: "Discussões moderadas por turma.", status: "available", category: "Engajamento", isNew: true },
  { id: "m5", name: "Aulas ao vivo", description: "Encontros síncronos integrados.", status: "trial", category: "Engajamento" },
  { id: "m6", name: "IA educacional", description: "Assistente para correções e feedback.", status: "locked", category: "Inteligência" },
  { id: "m7", name: "Relatórios avançados", description: "Dashboards e exportações.", status: "included", category: "Gestão" },
  { id: "m8", name: "Integrações", description: "Conecte ferramentas externas.", status: "available", category: "Integração" },
];

export const mockNotifications: NotificationItem[] = [
  { id: "n1", title: "12 redações aguardando", body: "Correções pendentes na Turma Redação", read: false, time: "Há 30 min" },
  { id: "n2", title: "Meta mensal em 72%", body: "Faltam 13 pontos para a meta de engajamento", read: false, time: "Há 2 h" },
  { id: "n3", title: "Novo módulo disponível", body: "Fórum está pronto para ativação", read: true, time: "Ontem" },
];

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
