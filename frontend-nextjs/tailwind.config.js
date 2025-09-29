/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'eld-green': '#00C7B7',
        'eld-blue': '#3da3ff',
        'eld-orange': '#ff9f43',
        'eld-red': '#ec4b4b',
        'eld-dark-green': '#20B2AA',
        'eld-light-green': '#40E0D0',
      },
      backgroundImage: {
        'gradient-eld': 'linear-gradient(135deg, #40E0D0 0%, #20B2AA 100%)',
      },
    },
  },
  plugins: [],
}
