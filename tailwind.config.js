/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          default: "var(--bg-surface-default)",
          weak: "var(--bg-surface-weak)",
        },
        text: {
          main: "var(--text-neutral-main)",
          sub: "var(--text-neutral-sub)",
          placeholder: "var(--text-placeholder)",
          soft: "var(--text-neutral-soft)",
          heading: {
            primary: "var(--text-heading-primary)",
            secondary: "var(--text-heading-secondary)",
          },
          error: "var(--text-state-error)",
        },
        border: {
          primary: "var(--border-border-primary)",
          secondary: "var(--border-border-secondary)",
          brand: "var(--border-border-brand)",
        },
        bg: {
          cards: "var(--background-bg-primary-cards)",
          brand: "var(--background-bg-brand-primary)",
          tertiary: "var(--background-bg-tertiary)",
          senary: "var(--background-bg-senary)",
        },
        brand: "var(--semantic-brand-500)",
        icon: {
          main: "var(--icon-neutral-main)",
          sub: "var(--icon-neutral-sub)",
          soft: "var(--icon-neutral-soft)",
          white: "var(--icon-neutral-white)",
        },
      },
      borderRadius: {
        6: "var(--radius-6)",
        8: "var(--radius-8)",
        10: "var(--radius-10)",
        12: "var(--radius-12)",
        16: "var(--radius-16)",
        24: "var(--radius-24)",
      },
      /* Do NOT override spacing: Tailwind's default scale (1=0.25rem, 2=8px, 4=16px, 6=24px, 8=32px) is used for layout. Use arbitrary values like p-[var(--space-12)] when design tokens are needed. */
      fontSize: {
        12: "12px",
        14: "14px",
      },
      boxShadow: {
        popup: "var(--shadow-popup)",
        "popup-strong": "var(--shadow-popup-strong)",
        tab: "var(--shadow-tab)",
      },
    },
  },
  plugins: [],
};
