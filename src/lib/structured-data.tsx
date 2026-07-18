import { SITE_NAME, SITE_URL } from "./constants";

const organizationId = `${SITE_URL}/#organization`;
const websiteId = `${SITE_URL}/#website`;
const softwareId = `${SITE_URL}/#software`;

export function getStructuredData() {
  const organization = {
    "@type": "Organization",
    "@id": organizationId,
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Plataforma modular de aprendizagem para empresas, escolas, cursinhos, professores e instituições educacionais.",
    logo: `${SITE_URL}/icon.png`,
  };

  const website = {
    "@type": "WebSite",
    "@id": websiteId,
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Crie cursos, gerencie alunos e expanda com módulos de avaliação, engajamento e analytics.",
    publisher: { "@id": organizationId },
    inLanguage: "pt-BR",
  };

  const software = {
    "@type": "SoftwareApplication",
    "@id": softwareId,
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description:
      "Plataforma SaaS modular para criação de cursos, gestão de alunos, avaliações, gamificação e acompanhamento de desempenho.",
    provider: { "@id": organizationId },
    featureList: [
      "Criação e gestão de cursos",
      "Turmas e matrículas",
      "Acompanhamento de progresso",
      "Módulos de redações e simulados",
      "Gamificação configurável",
      "Analytics e mapa de habilidades",
      "White-label e integrações",
    ],
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/PreOrder",
      description: "Planos e preços em definição. Demonstração conceitual.",
    },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organization, website, software],
  };
}

export function StructuredDataScript() {
  const data = getStructuredData();
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
