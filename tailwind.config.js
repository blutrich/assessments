/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        dot1: {
          '0%, 100%': { opacity: '0' },
          '20%': { opacity: '1' },
        },
        dot2: {
          '0%, 100%': { opacity: '0' },
          '40%': { opacity: '1' },
        },
        dot3: {
          '0%, 100%': { opacity: '0' },
          '60%': { opacity: '1' },
        },
        messageIn: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          },
        }
      },
      animation: {
        'dot1': 'dot1 1.5s infinite',
        'dot2': 'dot2 1.5s infinite',
        'dot3': 'dot3 1.5s infinite',
        'message-in': 'messageIn 0.3s ease-out forwards',
      },
      typography: (theme) => ({
        pink: {
          css: {
            '--tw-prose-body': theme('colors.pink.900'),
            '--tw-prose-headings': theme('colors.pink.900'),
            '--tw-prose-lead': theme('colors.pink.700'),
            '--tw-prose-links': theme('colors.pink.500'),
            '--tw-prose-bold': theme('colors.pink.700'),
            '--tw-prose-bullets': theme('colors.pink.500'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
