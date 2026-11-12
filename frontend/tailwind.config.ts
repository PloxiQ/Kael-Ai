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
          background: "#09090b",
          panel: "#18181b",
          border: "#27272a",
          accent: "#d4d4d8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
