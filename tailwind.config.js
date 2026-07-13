/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces Variable"', 'Georgia', 'serif'],
        body: ['"Inter Variable"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        'note-in': {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '70%': { transform: 'scale(1.03)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'note-in': 'note-in 0.45s cubic-bezier(0.21, 1.02, 0.73, 1) both',
        'pop-in': 'pop-in 0.35s ease-out both',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
