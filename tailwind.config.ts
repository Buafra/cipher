import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#04070D",
          raised: "#0D1424",
          hair: "rgba(59,130,246,0.15)",
        },

        paper: {
          DEFAULT: "#F8FAFC",
          dim: "#CBD5E1",
          faint: "#94A3B8",
        },

        brass: {
          DEFAULT: "#3B82F6",
          soft: "#EC4899",
        },

        accent: {
          DEFAULT: "#22C55E",
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
        glow: "0 0 40px rgba(59,130,246,0.18)",
      },
    },
  },

  plugins: [],
};

export default config;