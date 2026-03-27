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
        wine: {
          50: "#fdf2f2",
          100: "#fce4e4",
          200: "#f9cece",
          300: "#f2a8a8",
          400: "#e87474",
          500: "#d94545",
          600: "#722F37",
          700: "#5c2630",
          800: "#4a1f27",
          900: "#3d1a21",
        },
        nude: {
          50: "#fdfbf9",
          100: "#f8f0e8",
          200: "#f0dece",
          300: "#e6c9ae",
          400: "#d4a882",
          500: "#c49470",
          600: "#b07e58",
          700: "#94674a",
          800: "#795441",
          900: "#634638",
        },
      },
    },
  },
  plugins: [],
};

export default config;
