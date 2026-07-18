import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "./constants";

const title = "Eduvy | Plataforma modular de cursos e aprendizagem";
const description =
  "Crie cursos, gerencie alunos, acompanhe habilidades e adicione módulos de redações, simulados, questões, fórum e gamificação com a Eduvy.";

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: title,
    template: `%s | ${SITE_NAME}`,
  },
  description,
  keywords: [
    "plataforma de cursos",
    "aprendizagem modular",
    "LMS",
    "treinamento corporativo",
    "educação online",
    "gestão de alunos",
    "gamificação educacional",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Eduvy — Transforme conhecimento em evolução",
    description:
      "Uma plataforma modular para empresas, escolas e especialistas criarem experiências completas de aprendizagem.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eduvy — Transforme conhecimento em evolução",
    description:
      "Uma plataforma modular para empresas, escolas e especialistas criarem experiências completas de aprendizagem.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "pt-BR": SITE_URL,
    },
  },
};
