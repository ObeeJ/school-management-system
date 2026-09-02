/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#faf9f5",
        surface: "#f2f0e9",
        "surface-border": "#e2ded4",
        "text-main": "#1c1b18",
        "text-muted": "#57544d",
        "accent-navy": "#24333c",
        "accent-rust": "#8a3a2a",
        "status-green": "#2b6e4f",
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        mono: ["Consolas", "Courier New", "monospace"],
      },
      borderRadius: {
        DEFAULT: "3px",
        sm: "2px",
        md: "4px",
      },
    },
  },
  plugins: [],
};
