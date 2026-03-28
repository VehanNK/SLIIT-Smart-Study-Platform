/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4f46e5",
        "primary-light": "#6366f1",
        "primary-vibrant": "#4338ca",
        dark: "#0f172a",
        background: "#f4f4f5",
        "sliit-blue": "#002147",
        "sliit-gold": "#F2A900",
        // Module Color Tokens
        "mod-it3010": "#4ADE80", // Green
        "mod-it3020": "#FB923C", // Orange
        "mod-it3030": "#F472B6", // Pink
        "mod-it3040": "#38BDF8", // Light Blue
        "mod-default": "#94A3B8" // Slate
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out forwards',
      }
    },
  },
  plugins: [],
}
