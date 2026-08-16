/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f4f6fa',
          100: '#e9edf5',
          105: '#e2e7f2',
          150: '#dbe1ee',
          200: '#cbd5e8',
          205: '#c2cfdf',
          250: '#b0bfdf',
          300: '#9fb2d4',
          400: '#6d8ab9',
          450: '#5476a9',
          500: '#48699d',
          550: '#3e5c8e',
          600: '#38527f',
          700: '#2e4368',
          750: '#253755',
          800: '#1e2b44',
          805: '#1d2a42',
          850: '#17223b',
          855: '#162038',
          900: '#111827',
          950: '#070a10',
        },
        aqua: {
          50: '#f0fbfd',
          100: '#dcf5fa',
          200: '#beeaf3',
          300: '#90dbe9',
          400: '#5bc3da',
          500: '#3fa6c0',
          600: '#358ba3',
          700: '#307185',
          800: '#2e5e6e',
          900: '#2a505e',
          950: '#18333e',
        },
        safe: '#10b981', // emerald-500
        warning: '#f59e0b', // amber-500
        critical: '#ef4444', // red-500
        offline: '#6b7280', // gray-500
        health: '#06b6d4', // cyan-500
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
