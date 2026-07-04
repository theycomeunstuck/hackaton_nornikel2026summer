import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: "#101419",
          900: "#151b22",
          800: "#202832",
          700: "#2c3744",
        },
        ice: {
          50: "#f4fbff",
          100: "#e6f6ff",
          300: "#8ddcff",
          500: "#1fa7e1",
          600: "#087fb6",
        },
      },
      boxShadow: {
        glass: "0 24px 80px rgba(15, 23, 42, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
