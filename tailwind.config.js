/** @type {import('tailwindcss').Config} */
export default {
  // Эта строчка говорит: "Ищи классы tailwind во всех файлах внутри index.html и папки src"
  content: [
    "./index.html",
    // Ищем файлы в корне (App.tsx, index.tsx)
    "./*.{js,ts,jsx,tsx}", 
    // Ищем файлы в папках components, context и любых других подпапках
    "./components/*.{js,ts,jsx,tsx}",
    "./components/modals/*.{js,ts,jsx,tsx}",
    "./context/*.{js,ts,jsx,tsx}",
  ],
  theme: {
          extend: {
            fontFamily: {
              sans: ['"Chakra Petch"', 'sans-serif'],
              mono: ['"JetBrains Mono"', 'monospace'],
            },
            colors: {
              soviet: {
                red: '#D00000',
                darkred: '#8B0000',
                gold: '#FFD700',
                concrete: '#2F3337',
                metal: '#1A1D21',
                screen: '#101214'
              }
            }
          }
        },
  plugins: [],
}