export const loginCopy = {
  title: "Entrar na Eduvy",
  subtitle: "Acesse sua plataforma de aprendizagem.",
  emailLabel: "E-mail",
  emailPlaceholder: "seu@email.com",
  passwordLabel: "Senha",
  passwordPlaceholder: "Digite sua senha",
  rememberMe: "Manter conectado",
  forgotPassword: "Esqueci minha senha",
  submit: "Entrar",
  noAccount: "Ainda não tem uma plataforma?",
  createPlatform: "Criar minha plataforma",
  demoNotice:
    "Conta demo disponível abaixo quando a API estiver rodando com seed.",
  quickAccess: {
    title: "Acesso rápido",
    subtitle: "Ambiente de desenvolvimento — seed local",
    email: "owner@horizonte.demo",
    password: "Eduvy@2026!",
    label: "Proprietária demo",
    fillButton: "Preencher campos",
    submitButton: "Entrar agora",
  },
  errors: {
    generic: "Não foi possível entrar. Verifique suas credenciais e tente novamente.",
    apiOffline:
      "A API não está respondendo. Abra o Docker Desktop, rode pnpm infra:up e depois pnpm dev:api em outro terminal.",
  },
  panelTitle: "Sua jornada de ensino continua aqui.",
  panelDescription:
    "Gerencie cursos, acompanhe alunos e evolua sua operação em um único ambiente modular.",
  validation: {
    emailRequired: "Informe seu e-mail.",
    emailInvalid: "Informe um e-mail válido.",
    passwordRequired: "Informe sua senha.",
    passwordMin: "A senha deve ter pelo menos 8 caracteres.",
  },
} as const;
