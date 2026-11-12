import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Unbounded } from "next/font/google";
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

const monoFont = IBM_Plex_Mono({
  subsets: ["cyrillic", "latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KAEL — AI assistant",
  description: "A focused interface for a direct, intelligent AI assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        suppressHydrationWarning
        className={`${displayFont.variable} ${interfaceFont.variable} ${monoFont.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
