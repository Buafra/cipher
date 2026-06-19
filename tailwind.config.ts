import type { Config } from "tailwindcss";

/**
 * CIPHER design tokens.
 * Direction: premium private AI OS — deep navy, glass surfaces,
 * cool blue accent, clean slate typography.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#050816",
          raised: "#0B1220",
          hair: "rgba(96, 165, 250, 0.16)",
        },
        paper: {
          DEFAULT: "#F8FAFC",
          dim: "#CBD5E1",
          faint: "#94A3B8",
        },
        brass: {
          DEFAULT: "#3B82F6",
          soft: "#60A5FA",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        eyebrow: "0.24em",
      },
      maxWidth: {
        reading: "72rem",
      },
      boxShadow: {
        glow: "0 0 40px rgba(59, 130, 246, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;