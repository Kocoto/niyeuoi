/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#f472b6', // Pastel Pink
        'secondary': '#fb923c', // Pastel Orange
        'accent': '#ef4444', // Red
        'background': '#fffafb', // Off-white/pinkish
      },
      fontFamily: {
        'romantic': ['Dancing Script', 'cursive', 'serif'],
      }
    },
  },
  plugins: [],
}
