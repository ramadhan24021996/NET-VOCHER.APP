/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0f172a', /* Deep midnight blue */
        panel: '#1e293b',
        panelBorder: '#334155',
        primary: '#3b82f6',
        secondary: '#0ea5e9',
        accent: '#10b981',
        pinkAccent: '#ec4899',
      }
    },
  },
  plugins: [],
}
