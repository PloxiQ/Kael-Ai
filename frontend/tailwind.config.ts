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
          background: "#050507",
          surface: "#07070a",
          panel: "#0d0d12",
          border: "rgba(255, 255, 255, 0.08)",
          pink: "#f093fb",
          coral: "#f5576c",
          accent: "#f7a6ba",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Arial", "sans-serif"],
        sans: ["var(--font-interface)", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "Consolas", "monospace"],
      },
      backgroundImage: {
        "kael-gradient":
          "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        "kael-gradient-soft":
          "linear-gradient(135deg, rgba(240,147,251,0.16) 0%, rgba(245,87,108,0.14) 100%)",
      },
      boxShadow: {
        "kael-glow":
          "0 24px 70px -30px rgba(0, 0, 0, 0.95), 0 0 60px -24px rgba(245, 87, 108, 0.35)",
        "kael-accent":
          "0 16px 44px -18px rgba(245, 87, 108, 0.6), 0 0 40px -20px rgba(240, 147, 251, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
