/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A58FF',
        accent: '#FF3D71',
        surface: '#FFFFFF',
        bg: '#F8FAFF',
      },
      borderRadius: {
        lg: '2.25rem',
        xl: '3.5rem',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
