import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eduvy — Plataforma modular de aprendizagem",
    short_name: "Eduvy",
    description:
      "Crie cursos, gerencie alunos e expanda com módulos de avaliação, engajamento e analytics.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F5FF",
    theme_color: "#7C3AED",
    lang: "pt-BR",
  };
}
