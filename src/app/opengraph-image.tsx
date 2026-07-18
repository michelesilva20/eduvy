import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Eduvy — Transforme conhecimento em evolução";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0E0A1F 0%, #17102C 50%, #7C3AED 100%)",
          color: "#F8F7FF",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#9B5CFF",
            }}
          />
          <span style={{ fontSize: 36, fontWeight: 700 }}>eduvy</span>
        </div>
        <h1
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 900,
            margin: 0,
          }}
        >
          Transforme conhecimento em evolução
        </h1>
        <p
          style={{
            fontSize: 28,
            opacity: 0.85,
            marginTop: 24,
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Plataforma modular de aprendizagem para empresas, escolas e
          especialistas
        </p>
      </div>
    ),
    { ...size },
  );
}
