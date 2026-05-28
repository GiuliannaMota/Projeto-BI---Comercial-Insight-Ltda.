import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        panel: "hsl(var(--panel))",
        "panel-strong": "hsl(var(--panel-strong))",
        lime: {
          signal: "hsl(var(--lime-signal))",
        },
        violet: {
          signal: "hsl(var(--violet-signal))",
        },
        red: {
          signal: "hsl(var(--red-signal))",
        },
      },
      fontFamily: {
        sans: ["Satoshi", "Geist", "Aptos", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Consolas", "monospace"],
      },
      boxShadow: {
        glass: "0 24px 80px -40px rgba(2, 6, 23, 0.9)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.08)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
