import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#edf9f9",
          100: "#d3f0f1",
          200: "#a7e1e2",
          300: "#74cfd1",
          400: "#43b6b9",
          500: "#2ca0a4",
          600: "#1f7c80",
          700: "#195f63",
          800: "#154c50",
          900: "#103b3e",
          DEFAULT: "#1f7c80",
          dark: "#154c50",
          light: "#d3f0f1",
          muted: "#e7f5f5",
        },
        accent: {
          DEFAULT: "#7c83ff",
          light: "#b5b8ff",
          muted: "#eef0ff",
        },
        danger: {
          DEFAULT: "#e66a6a",
          light: "#fde3e3",
        },
        surface: "#f8fafb",
      },
      boxShadow: {
        soft: "0 15px 35px rgba(17, 102, 104, 0.15)",
        card: "0 18px 40px rgba(15, 23, 42, 0.08)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-soft": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        float: "float 10s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2.4s infinite",
      },
    },
  },
  plugins: [typography],
};

export default config;


