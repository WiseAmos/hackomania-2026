import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Peacetime palette
        "pt-bg": "#0A0A0A",
        "pt-surface": "#1A1A1A",
        "pt-panel": "#242424",
        "pt-cyan": "#00F0FF",
        "pt-cyan-dim": "#00B8C4",
        "pt-text": "#F0F0F0",
        "pt-muted": "#6B7280",

        // Crisis palette
        "cr-bg": "#0D0D0D",
        "cr-surface": "#1A0A00",
        "cr-orange": "#FF4D00",
        "cr-red": "#FF2020",
        "cr-text": "#FFFFFF",
        "cr-muted": "#AAAAAA",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "vault-breathe": "vaultBreathe 4s ease-in-out infinite",
        "skeleton": "skeleton 1.5s ease-in-out infinite",
      },
      keyframes: {
        vaultBreathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
        },
        skeleton: {
          "0%": { backgroundPosition: "-200px 0" },
          "100%": { backgroundPosition: "calc(200px + 100%) 0" },
        },
      },
      screens: {
        xs: "375px",
      },
    },
  },
  plugins: [],
};

export default config;
