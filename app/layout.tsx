import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Escala MUSIC — Banda RGNR",
  description: "Disponibilidade e escala da Banda do MUSIC (RGNR / IPDA)",
};

// O músico abre isso no celular, dentro do WhatsApp (PRD §3).
// themeColor pinta a barra do navegador com o fundo do app.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // "dark" é fixo: o app é escuro por identidade da marca, não por
    // preferência do sistema. O logo do RGNR MUSIC é branco sobre escuro.
    <html
      lang="pt-BR"
      className={`dark ${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
