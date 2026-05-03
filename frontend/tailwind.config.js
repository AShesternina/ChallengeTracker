/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        surface2: "var(--color-surface2)",
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "accent-soft": "var(--color-accent-soft)",
        "accent-mid": "var(--color-accent-mid)",
        success: "var(--color-success)",
        "success-bg": "var(--color-success-bg)",
        danger: "var(--color-danger)",
        "danger-bg": "var(--color-danger-bg)",
        warning: "var(--color-warning)",
        "warning-bg": "var(--color-warning-bg)",
        info: "var(--color-info)",
        "info-bg": "var(--color-info-bg)",
        "nav-bg": "var(--color-nav-bg)",
        "header-bg": "var(--color-header-bg)",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Inter", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
      },
      boxShadow: {
        sm: "0 1px 4px rgba(0,0,0,0.06)",
        md: "0 4px 16px rgba(0,0,0,0.08)",
        lg: "0 8px 32px rgba(0,0,0,0.12)",
        accent: "0 4px 14px rgba(91,76,245,0.3)",
      },
    },
  },
  plugins: [],
};
