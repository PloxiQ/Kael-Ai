import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kael: {
          bg: "var(--kael-bg)",
          surface: "var(--kael-surface)",
          raised: "var(--kael-raised)",
          border: "var(--kael-border)",
          text: "var(--kael-text)",
          muted: "var(--kael-muted)",
          accent: "var(--kael-accent)",
          "accent-strong": "var(--kael-accent-strong)",
          "accent-ink": "var(--kael-accent-ink)",
        },
      },
      fontFamily: {
        display: ["var(--font-display-active)", "Arial", "sans-serif"],
        sans: ["var(--font-interface-active)", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 24px 64px -24px rgba(0, 0, 0, 0.9)",
        "accent-line": "inset 0 1px 0 0 rgba(16, 185, 129, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
