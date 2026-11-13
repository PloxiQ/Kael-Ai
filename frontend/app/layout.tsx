import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Manrope, Unbounded } from "next/font/google";
import { TelegramAuthProvider } from "../components/TelegramAuthProvider";
import { LanguageProvider } from "../lib/i18n";
import "./globals.css";
import "./kael-auth.css";

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
  viewportFit: "cover",
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
        {/* beforeInteractive guarantees window.Telegram exists before the
            auth provider runs. */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <LanguageProvider>
          <TelegramAuthProvider>{children}</TelegramAuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
