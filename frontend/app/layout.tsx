import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Onest, Unbounded } from "next/font/google";
import { KaelAuthProvider } from "../components/auth/KaelAuthProvider";
import { LanguageProvider } from "../lib/i18n";
import "./globals.css";
import "./kael-auth.css";
import "./theme-light.css";

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["cyrillic", "latin"],
  variable: "--font-inter",
  display: "swap",
});

const onest = Onest({
  subsets: ["cyrillic", "latin"],
  variable: "--font-onest",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["cyrillic", "latin"],
  variable: "--font-unbounded",
  display: "swap",
});

/**
 * Applies the saved theme and fonts before the first paint. Without this the
 * page would flash the dark palette before preferences are read from storage.
 */
const THEME_BOOTSTRAP_SCRIPT = `(function(){try{
var p=JSON.parse(localStorage.getItem("kael-preferences")||"{}")||{};
var themes=["dark","light"];
var interfaces=["manrope","inter","onest","system"];
var displays=["unbounded","onest","manrope","system"];
var theme=themes.indexOf(p.theme)>=0?p.theme:"dark";
var ui=interfaces.indexOf(p.interfaceFont)>=0?p.interfaceFont:"manrope";
var display=displays.indexOf(p.displayFont)>=0?p.displayFont:"unbounded";
var root=document.documentElement;
root.dataset.theme=theme;
root.dataset.interfaceFont=ui;
root.dataset.displayFont=display;
root.style.colorScheme=theme;
var meta=document.querySelector('meta[name="theme-color"]');
if(meta){meta.setAttribute("content",theme==="light"?"#F5F7F3":"#0A0A0A");}
}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL("https://kael-ai.ct.ws"),
  title: "KAEL — ясность без шума",
  description:
    "Минималистичный интерфейс AI-ассистента KAEL: точные ответы, код и документы без лишнего шума.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${manrope.variable} ${inter.variable} ${onest.variable} ${unbounded.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <KaelAuthProvider>{children}</KaelAuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
