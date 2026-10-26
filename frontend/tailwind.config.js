/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0B192C',
          navy: '#1E3E62',
          orange: '#FF6500',
          accent: '#00B4D8',
          teal: '#009688',
        }
      }
    },
  },
  plugins: [],
}