import type { Config } from "tailwindcss";

// Colour, radius, shadow and motion tokens live as CSS variables in src/app/globals.css
// (light + dark). See .claude/skills/markpath-design/SKILL.md.
const durations = ["none", "xshort", "short", "normal", "slow", "xslow"];
const easings = ["none", "out-quad", "out-cubic", "out-quart", "out-quint", "in-cubic", "in-quart", "in-out-cubic", "in-out-quart"];

/** Token colour that still supports Tailwind's /opacity modifier (e.g. border-danger/40). */
const token = (name: string) => `color-mix(in srgb, var(--color-${name}) calc(<alpha-value> * 100%), transparent)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: token("canvas"),
        surface: token("surface"),
        subtle: token("subtle"),
        ink: token("ink"),
        muted: token("muted"),
        border: token("border"),
        "border-strong": token("border-strong"),
        brand: token("brand"),
        "brand-solid": token("brand-solid"),
        "brand-solid-hover": token("brand-solid-hover"),
        "brand-soft": token("brand-soft"),
        success: token("success"),
        "success-soft": token("success-soft"),
        warning: token("warning"),
        "warning-soft": token("warning-soft"),
        danger: token("danger"),
        "danger-soft": token("danger-soft")
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      borderRadius: { control: "var(--radius-control)", card: "var(--radius-card)" },
      boxShadow: { card: "var(--shadow-card)", pop: "var(--shadow-pop)" },
      transitionDuration: Object.fromEntries(durations.map((d) => [d, `var(--duration-${d})`])),
      transitionTimingFunction: Object.fromEntries(easings.map((e) => [e, `var(--ease-${e})`]))
    }
  },
  plugins: []
};

export default config;
