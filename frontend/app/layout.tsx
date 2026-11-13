import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { LanguageProvider } from "../lib/i18n";
import "./globals.css";

const displayFont = Unbounded({
  subsets: ["cyrillic", "latin"],
  variable: "--font-display",
  display: "swap",
});

const interfaceFont = Manrope({
  subsets: ["cyrillic", "latin"],
  variable: "--font-interface",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KAEL — ясность без шума",
  description:
    "Минималистичный интерфейс AI-ассистента KAEL: точные ответы, код и документы без лишнего шума.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050507",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${displayFont.variable} ${interfaceFont.variable}`}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
