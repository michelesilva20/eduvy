import { Nunito_Sans, Sora } from "next/font/google";
import { siteMetadata } from "@/lib/metadata";
import { StructuredDataScript } from "@/lib/structured-data";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = siteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${nunitoSans.variable} scroll-smooth`}>
      <body className="min-h-screen bg-background-light font-[family-name:var(--font-nunito)] text-text-dark antialiased">
        <a href="#conteudo-principal" className="skip-link">
          Ir para o conteúdo principal
        </a>
        <StructuredDataScript />
        {children}
      </body>
    </html>
  );
}
