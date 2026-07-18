import type {
  Achievement,
  AnalyticsMetric,
  Audience,
  DemoModuleChip,
  EduvyModule,
  FAQItem,
  FooterLinkGroup,
  ModularStep,
  NavigationItem,
  PlatformFeature,
  PricingPlan,
  Skill,
  UseCase,
  ValuePillar,
} from "@/types/landing";

export const navigationItems: NavigationItem[] = [
  { label: "Plataforma", href: "#plataforma" },
  { label: "Soluções", href: "#solucoes" },
  { label: "Módulos", href: "#modulos" },
  { label: "Gamificação", href: "#gamificacao" },
  { label: "Planos", href: "#planos" },
  { label: "Recursos", href: "#faq" },
];

export const audiences: Audience[] = [
  {
    id: "empresas",
    name: "Empresas",
    description: "Treinamentos internos, onboarding e trilhas por cargo.",
    icon: "building-2",
  },
  {
    id: "escolas",
    name: "Escolas e cursinhos",
    description: "Reforço, preparação e acompanhamento contínuo.",
    icon: "graduation-cap",
  },
  {
    id: "professores",
    name: "Professores",
    description: "Cursos profissionais com turmas e comunidade.",
    icon: "user-round",
  },
  {
    id: "organizacoes",
    name: "Organizações educacionais",
    description: "Programas de capacitação com visão institucional.",
    icon: "landmark",
  },
];

export const valuePillars: ValuePillar[] = [
  {
    id: "crie",
    title: "Crie",
    description:
      "Organize cursos, aulas, materiais e trilhas em uma experiência clara e envolvente.",
  },
  {
    id: "engaje",
    title: "Engaje",
    description:
      "Use desafios, níveis, conquistas e comunidades para manter os alunos participando.",
  },
  {
    id: "evolua",
    title: "Evolua",
    description:
      "Acompanhe desempenho, habilidades e oportunidades de melhoria com dados objetivos.",
    featured: true,
  },
];

export const platformFeatures: PlatformFeature[] = [
  { id: "1", label: "Cursos e trilhas ilimitadas conforme o plano" },
  { id: "2", label: "Aulas em vídeo, texto, áudio e arquivos" },
  { id: "3", label: "Turmas e matrículas" },
  { id: "4", label: "Acompanhamento de progresso" },
  { id: "5", label: "Certificados" },
  { id: "6", label: "Comunicação com alunos" },
];

export const eduvyModules: EduvyModule[] = [
  {
    id: "redacoes",
    name: "Redações",
    description: "Envio, correção manual ou assistida por IA.",
    category: "avaliacao",
    icon: "pen-line",
    connected: true,
  },
  {
    id: "simulados",
    name: "Simulados",
    description: "Provas cronometradas com relatórios detalhados.",
    category: "avaliacao",
    icon: "clipboard-check",
    connected: true,
  },
  {
    id: "banco-questoes",
    name: "Banco de questões",
    description: "Organize questões por matéria, dificuldade e tema.",
    category: "avaliacao",
    icon: "library-big",
    connected: true,
  },
  {
    id: "forum",
    name: "Fórum",
    description: "Discussões moderadas por turma ou curso.",
    category: "engajamento",
    icon: "messages-square",
    connected: true,
  },
  {
    id: "gamificacao",
    name: "Gamificação",
    description: "Níveis, XP, conquistas e desafios configuráveis.",
    category: "engajamento",
    icon: "trophy",
    connected: true,
  },
  {
    id: "aulas-ao-vivo",
    name: "Aulas ao vivo",
    description: "Encontros síncronos integrados à trilha.",
    category: "engajamento",
    icon: "video",
    connected: true,
  },
  {
    id: "certificados",
    name: "Certificados avançados",
    description: "Modelos personalizados e validação de conclusão.",
    category: "gestao",
    icon: "award",
    connected: true,
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Painéis de desempenho individual e por turma.",
    category: "gestao",
    icon: "chart-no-axes-combined",
    connected: true,
  },
  {
    id: "universidade",
    name: "Universidade corporativa",
    description: "Programas estruturados para capacitação interna.",
    category: "gestao",
    icon: "building",
    connected: true,
  },
  {
    id: "white-label",
    name: "White-label",
    description: "Marca, cores e domínio próprios.",
    category: "personalizacao",
    icon: "palette",
    connected: true,
  },
  {
    id: "integracoes",
    name: "Integrações",
    description: "Conecte ferramentas externas à sua operação.",
    category: "personalizacao",
    icon: "plug",
    connected: true,
  },
  {
    id: "app",
    name: "Aplicativo personalizado",
    description: "Experiência mobile com a identidade da instituição.",
    category: "personalizacao",
    icon: "smartphone",
    connected: true,
  },
];

export const moduleCategoryLabels: Record<
  EduvyModule["category"],
  string
> = {
  avaliacao: "Avaliação",
  engajamento: "Engajamento",
  gestao: "Gestão",
  personalizacao: "Personalização",
};

export const achievements: Achievement[] = [
  {
    id: "streak",
    title: "Sequência de 7 dias",
    description: "Estudou por 7 dias consecutivos",
    icon: "flame",
    unlocked: true,
  },
  {
    id: "first-module",
    title: "Primeiro módulo",
    description: "Concluiu o primeiro módulo do curso",
    icon: "badge-check",
    unlocked: true,
  },
  {
    id: "top-10",
    title: "Top 10 da turma",
    description: "Entrou no ranking semanal",
    icon: "medal",
    unlocked: false,
  },
];

export const useCases: UseCase[] = [
  {
    id: "empresas",
    tabLabel: "Empresas",
    title: "Transforme treinamentos em desenvolvimento contínuo.",
    features: [
      "Onboarding estruturado",
      "Compliance e treinamentos obrigatórios",
      "Trilhas por cargo",
      "Gestão de competências",
      "Relatórios por equipe",
    ],
    illustration: {
      headline: "Treinamento de Segurança — Equipe Operacional",
      metrics: [
        { label: "Conclusão", value: "89%" },
        { label: "Competências", value: "12 ativas" },
        { label: "Turmas", value: "4 equipes" },
      ],
    },
  },
  {
    id: "cursinhos",
    tabLabel: "Cursinhos",
    title: "Prepare alunos com conteúdo, prática e acompanhamento.",
    features: [
      "Simulados e banco de questões",
      "Correção de redações",
      "Ranking e gamificação",
      "Cronograma de estudos",
      "Análise por matéria",
    ],
    illustration: {
      headline: "Preparação ENEM — Turma 2026",
      metrics: [
        { label: "Simulados", value: "24 aplicados" },
        { label: "Média geral", value: "78%" },
        { label: "Redações", value: "156 corrigidas" },
      ],
    },
  },
  {
    id: "escolas",
    tabLabel: "Escolas",
    title: "Amplie a experiência de aprendizagem além da sala de aula.",
    features: [
      "Reforço escolar",
      "Materiais complementares",
      "Atividades e fóruns",
      "Acompanhamento por turma",
      "Comunicação com famílias",
    ],
    illustration: {
      headline: "Reforço de Matemática — 8º ano",
      metrics: [
        { label: "Alunos ativos", value: "142" },
        { label: "Atividades", value: "38 publicadas" },
        { label: "Participação", value: "91%" },
      ],
    },
  },
  {
    id: "professores",
    tabLabel: "Professores",
    title: "Transforme seu conhecimento em uma experiência profissional.",
    features: [
      "Criação de cursos",
      "Gestão de turmas",
      "Comunidade de alunos",
      "Certificados",
      "Marca própria",
    ],
    illustration: {
      headline: "Interpretação de Textos — Curso autoral",
      metrics: [
        { label: "Alunos", value: "320" },
        { label: "Aulas", value: "48 publicadas" },
        { label: "Conclusão", value: "67%" },
      ],
    },
  },
];

export const analyticsMetrics: AnalyticsMetric[] = [
  {
    id: "active",
    label: "Alunos ativos",
    value: "1.248",
    change: "+8%",
    trend: "up",
  },
  {
    id: "completion",
    label: "Conclusão dos cursos",
    value: "74%",
    change: "+5%",
    trend: "up",
  },
  {
    id: "performance",
    label: "Média de desempenho",
    value: "82%",
    change: "+3%",
    trend: "up",
  },
  {
    id: "participation",
    label: "Participação semanal",
    value: "88%",
    change: "Estável",
    trend: "neutral",
  },
];

export const skills: Skill[] = [
  { id: "comunicacao", name: "Comunicação", level: 4, x: 50, y: 15 },
  { id: "interpretacao", name: "Interpretação", level: 5, x: 20, y: 45 },
  { id: "logica", name: "Raciocínio lógico", level: 4, x: 80, y: 40 },
  { id: "lideranca", name: "Liderança", level: 3, x: 35, y: 75 },
  { id: "seguranca", name: "Segurança", level: 5, x: 65, y: 70 },
  { id: "tecnico", name: "Conhecimento técnico", level: 4, x: 50, y: 50 },
];

export const modularSteps: ModularStep[] = [
  {
    id: "comece",
    step: 1,
    title: "Comece",
    description: "Estruture sua operação com o essencial.",
    items: ["Cursos", "Alunos", "Turmas", "Progresso"],
  },
  {
    id: "expand",
    step: 2,
    title: "Expanda",
    description: "Adicione avaliação e engajamento.",
    items: ["Avaliações", "Redações", "Simulados", "Comunidade"],
  },
  {
    id: "personalize",
    step: 3,
    title: "Personalize",
    description: "Escale com marca e integrações.",
    items: ["Marca própria", "Integrações", "Aplicativo", "Analytics avançado"],
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    id: "essencial",
    name: "Essencial",
    description: "Indicado para professores e projetos menores.",
    features: [
      "Criação de cursos",
      "Aulas e materiais",
      "Alunos e turmas",
      "Acompanhamento de progresso",
      "Certificados básicos",
    ],
    cta: "Começar com o Essencial",
    variant: "default",
  },
  {
    id: "profissional",
    name: "Profissional",
    description: "Indicado para escolas, cursinhos e operações em crescimento.",
    features: [
      "Tudo do Essencial",
      "Mais administradores",
      "Automações e relatórios",
      "Personalização visual",
      "Integrações essenciais",
    ],
    cta: "Conhecer o Profissional",
    highlighted: true,
    variant: "highlight",
  },
  {
    id: "organizacoes",
    name: "Organizações",
    description: "Indicado para empresas e instituições.",
    features: [
      "Múltiplas equipes",
      "Trilhas por cargo",
      "Competências",
      "Segurança avançada",
      "Suporte especializado",
      "Personalização completa",
    ],
    cta: "Falar com um especialista",
    variant: "enterprise",
  },
];

export const demoModuleChips: DemoModuleChip[] = [
  { id: "redacoes", label: "Redações" },
  { id: "simulados", label: "Simulados" },
  { id: "banco-questoes", label: "Banco de questões" },
  { id: "forum", label: "Fórum" },
  { id: "gamificacao", label: "Gamificação" },
  { id: "white-label", label: "White-label" },
  { id: "app", label: "Aplicativo" },
  { id: "analytics", label: "Analytics" },
];

export const faqItems: FAQItem[] = [
  {
    id: "faq-1",
    question: "A Eduvy serve apenas para escolas?",
    answer:
      "Não. A Eduvy foi pensada para empresas, escolas, cursinhos, professores autônomos e organizações educacionais. Cada contexto pode usar os mesmos recursos essenciais e escolher módulos adicionais conforme a necessidade.",
  },
  {
    id: "faq-2",
    question: "Posso criar diferentes tipos de curso?",
    answer:
      "Sim. Você pode estruturar cursos livres, trilhas sequenciais, programas por turma ou treinamentos corporativos. Aulas podem combinar vídeo, texto, áudio, arquivos e atividades.",
  },
  {
    id: "faq-3",
    question: "Os módulos adicionais são obrigatórios?",
    answer:
      "Não. Todos os planos incluem a estrutura principal de cursos, alunos e progresso. Módulos como redações, simulados, fórum ou white-label são contratados apenas quando fizerem sentido para sua operação.",
  },
  {
    id: "faq-4",
    question: "É possível utilizar minha própria marca?",
    answer:
      "Sim. Com os módulos de personalização, é possível aplicar identidade visual, domínio próprio e experiência white-label. O nível de personalização varia conforme o plano e os módulos escolhidos.",
  },
  {
    id: "faq-5",
    question: "A plataforma possui gamificação?",
    answer:
      "Sim, como módulo opcional. Você pode ativar níveis, XP, conquistas, desafios e rankings de forma configurável — usando apenas os mecanismos que complementam sua estratégia pedagógica.",
  },
  {
    id: "faq-6",
    question: "A Eduvy pode ser utilizada para treinamentos internos?",
    answer:
      "Sim. Empresas podem criar trilhas por cargo, acompanhar competências, gerar relatórios por equipe e estruturar programas de onboarding ou compliance em um único ambiente.",
  },
  {
    id: "faq-7",
    question: "Será possível integrar outras ferramentas?",
    answer:
      "Sim. A arquitetura modular da Eduvy prevê integrações com ferramentas externas de comunicação, pagamentos, videoconferência e sistemas internos, conforme plano e módulos contratados.",
  },
  {
    id: "faq-8",
    question: "Consigo acompanhar o desempenho dos alunos?",
    answer:
      "Sim. A plataforma oferece acompanhamento de progresso, participação, desempenho em avaliações e evolução de habilidades — com dashboards individuais e por turma quando o módulo de analytics está ativo.",
  },
];

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    title: "Produto",
    links: [
      { label: "Plataforma", href: "#plataforma" },
      { label: "Módulos", href: "#modulos" },
      { label: "Gamificação", href: "#gamificacao" },
      { label: "Analytics", href: "#analytics" },
      { label: "Planos", href: "#planos" },
    ],
  },
  {
    title: "Soluções",
    links: [
      { label: "Empresas", href: "#solucoes" },
      { label: "Escolas", href: "#solucoes" },
      { label: "Cursinhos", href: "#solucoes" },
      { label: "Professores", href: "#solucoes" },
    ],
  },
  {
    title: "Recursos",
    links: [
      { label: "Conteúdos", demo: true },
      { label: "Central de ajuda", demo: true },
      { label: "Documentação", demo: true },
      { label: "Status", demo: true },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre", demo: true },
      { label: "Contato", demo: true },
      { label: "Privacidade", demo: true },
      { label: "Termos", demo: true },
    ],
  },
];

export const courseBuilderModules = [
  { id: "m1", title: "Introdução ao vestibular", lessons: 4, status: "published" as const },
  { id: "m2", title: "Interpretação de texto", lessons: 8, status: "published" as const },
  { id: "m3", title: "Redação argumentativa", lessons: 6, status: "draft" as const },
  { id: "m4", title: "Simulados integrados", lessons: 3, status: "draft" as const },
];

export const courseBuilderLesson = {
  title: "Técnicas de interpretação — Aula 3",
  type: "Vídeo + material complementar",
  duration: "18 min",
  status: "published" as const,
};
