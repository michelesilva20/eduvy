import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileText,
  FlaskConical,
  Gamepad2,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  MessageSquare,
  Package,
  PenLine,
  Plug,
  Settings,
  Users,
  UserSquare2,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export const platformNavSections: NavSection[] = [
  {
    id: "main",
    label: "Principal",
    items: [
      { id: "overview", label: "Visão geral", href: "/app", icon: LayoutDashboard },
      { id: "courses", label: "Cursos", href: "/app/courses", icon: BookOpen },
      { id: "classes", label: "Turmas", href: "/app/classes", icon: GraduationCap },
    ],
  },
  {
    id: "academic",
    label: "Gestão acadêmica",
    items: [
      { id: "students", label: "Alunos", href: "/app/students", icon: Users },
      { id: "teachers", label: "Professores", href: "/app/teachers", icon: UserSquare2 },
      { id: "content", label: "Conteúdos", href: "/app/content", icon: FileText },
      { id: "assessments", label: "Avaliações", href: "/app/assessments", icon: ClipboardCheck },
    ],
  },
  {
    id: "resources",
    label: "Recursos educacionais",
    items: [
      { id: "essays", label: "Redações", href: "/app/essays", icon: PenLine },
      { id: "questions", label: "Banco de questões", href: "/app/questions", icon: LibraryBig },
      { id: "simulations", label: "Simulados", href: "/app/simulations", icon: FlaskConical },
      { id: "forum", label: "Fórum", href: "/app/forum", icon: MessageSquare },
    ],
  },
  {
    id: "engagement",
    label: "Engajamento",
    items: [
      { id: "gamification", label: "Gamificação", href: "/app/gamification", icon: Gamepad2 },
      { id: "certificates", label: "Certificados", href: "/app/certificates", icon: Award },
    ],
  },
  {
    id: "admin",
    label: "Administração",
    items: [
      { id: "reports", label: "Relatórios", href: "/app/reports", icon: BarChart3 },
      { id: "modules", label: "Módulos", href: "/app/modules", icon: Package },
      { id: "integrations", label: "Integrações", href: "/app/integrations", icon: Plug },
      { id: "settings", label: "Configurações", href: "/app/settings", icon: Settings },
    ],
  },
];

export const quickCreateActions = [
  { label: "Novo curso", href: "/app/courses/new" },
  { label: "Nova turma", href: "/app/classes" },
  { label: "Novo aluno", href: "/app/students" },
  { label: "Novo professor", href: "/app/teachers" },
  { label: "Nova avaliação", href: "/app/assessments" },
  { label: "Novo conteúdo", href: "/app/content" },
];

export const helpLinks = [
  { label: "Central de ajuda", href: "#" },
  { label: "Suporte", href: "#" },
];

const allNavItems = platformNavSections.flatMap((section) =>
  section.items.map((item) => ({ ...item, sectionLabel: section.label })),
);

export function getPlatformNavContext(pathname: string) {
  const sorted = [...allNavItems].sort((a, b) => b.href.length - a.href.length);

  for (const item of sorted) {
    const isMatch =
      pathname === item.href ||
      (item.href !== "/app" && pathname.startsWith(`${item.href}/`));

    if (isMatch) {
      return {
        icon: item.icon,
        sectionLabel: item.sectionLabel,
        itemLabel: item.label,
      };
    }
  }

  return {
    icon: LayoutDashboard,
    sectionLabel: "Principal",
    itemLabel: "Visão geral",
  };
}
