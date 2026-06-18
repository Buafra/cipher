import type { Config } from "tailwindcss";

/**
 * CIPHER design tokens.
 * Direction: a private service seen at midnight — deep ink, warm paper-white
 * text, one restrained brass accent (the concierge bell). Calm and deferential.
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
          DEFAULT: "#0E0F11", // page background
          raised: "#16181B",  // cards / surfaces
          hair: "#26282C",    // hairline borders
        },
        paper: {
          DEFAULT: "#E8E6E1", // primary text
          dim: "#8A8B87",     // secondary text
          faint: "#5C5E5B",   // tertiary / captions
        },
        brass: {
          DEFAULT: "#B89B6E", // the single accent
          soft: "#8A744F",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        eyebrow: "0.22em",
      },
      maxWidth: {
        reading: "44rem",
      },
    },
  },
  plugins: [],
};

export default config;
