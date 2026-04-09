import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Core
          primary:                "var(--brand-primary)",
          "primary-hover":        "var(--brand-primary-hover)",
          "primary-foreground":   "var(--brand-primary-foreground)",
          // Soft variants
          "primary-soft":         "var(--brand-primary-soft)",
          "primary-soft-strong":  "var(--brand-primary-soft-strong)",
          "primary-soft-accent":  "var(--brand-primary-soft-accent)",
          // Borders
          "primary-border":       "var(--brand-primary-border)",
          "primary-border-strong":"var(--brand-primary-border-strong)",
          // Text
          "primary-text":         "var(--brand-primary-text)",
          "primary-text-strong":  "var(--brand-primary-text-strong)",
          // Surfaces
          page:                   "var(--brand-page)",
          surface:                "var(--brand-surface)",
          "surface-elevated":     "var(--brand-surface-elevated)",
          "surface-strong":       "var(--brand-surface-strong)",
          // Text roles
          text:                   "var(--brand-text)",
          "text-muted":           "var(--brand-text-muted)",
          "text-subtle":          "var(--brand-text-subtle)",
          // Dimmed (disabled/readonly)
          dimmed:                 "var(--brand-dimmed-surface)",
          "dimmed-border":        "var(--brand-dimmed-border)",
          "dimmed-text":          "var(--brand-dimmed-text)",
          // Legacy aliases
          soft:                   "var(--brand-primary-soft)",
          "soft-strong":          "var(--brand-primary-soft-strong)",
          border:                 "var(--brand-primary-border)",
        },
        kakao: {
          DEFAULT:    "var(--kakao-bg)",
          hover:      "var(--kakao-bg-hover)",
          text:       "var(--kakao-text)",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "system-ui", "-apple-system", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #001d6e 0%, #001d6e 100%)",
      },
      boxShadow: {
        brand:        "0 10px 30px var(--brand-shadow)",
        "brand-header": "0 8px 24px var(--brand-shadow)",
      },
      ringColor: {
        brand: "var(--brand-ring)",
      },
    },
  },
  plugins: [],
};

export default config;
