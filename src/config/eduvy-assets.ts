export const eduvyAssets = {
  brand: {
    symbol: {
      src: "/brand/eduvy-symbol.webp",
      width: 1254,
      height: 1254,
      alt: "Eduvy",
    },
  },
  illustrations: {
    learningJourney: {
      src: "/illustrations/eduvy-learning-journey.webp",
      width: 1448,
      height: 1086,
      alt: "Jornada de aprendizagem na Eduvy com trilha, progresso e conquistas",
    },
    platformEcosystem: {
      src: "/illustrations/eduvy-platform-ecosystem.webp",
      width: 1448,
      height: 1086,
      alt: "Ecossistema Eduvy conectando empresas, escolas, professores e alunos",
    },
    courseBuilder: {
      src: "/illustrations/eduvy-course-builder-laptop.webp",
      width: 1254,
      height: 1254,
      alt: "Construtor de cursos da Eduvy em notebook com módulos, aulas e prévia do aluno",
    },
    mobileApp: {
      src: "/illustrations/eduvy-mobile-app.webp",
      width: 1254,
      height: 1254,
      alt: "Aplicativo mobile Eduvy com cursos, progresso, desafios e conquistas",
    },
    modules: {
      src: "/illustrations/eduvy-modules-ecosystem.webp",
      width: 1448,
      height: 1086,
      alt: "Módulos adicionais da Eduvy: redações, simulados, fórum, gamificação e integrações",
    },
    login: {
      src: "/illustrations/eduvy-login-student.webp",
      width: 1122,
      height: 1402,
      alt: "Aluno acessando a plataforma Eduvy com progresso e conquistas",
    },
    analytics: {
      src: "/illustrations/eduvy-analytics-dashboard.webp",
      width: 1448,
      height: 1086,
      alt: "Dashboard analítico da Eduvy com métricas de evolução e engajamento",
    },
  },
} as const;

export type EduvyAssetMeta = {
  src: string;
  width: number;
  height: number;
  alt: string;
};
