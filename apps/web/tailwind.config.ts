import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        headline: ['Inter'],
        body: ['Inter'],
        label: ['Inter'],
      },
      colors: {
        primary: '#0079BF',
        'primary-fixed': '#cfe5ff',
        'primary-container': '#0079BF',
        'on-primary': '#ffffff',
        'on-surface': '#172B4D',
        'on-surface-variant': '#5E6C84',
        'surface': '#F4F5F7',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#F4F5F7',
        'surface-container': '#EBECF0',
        'surface-container-high': '#DFE1E6',
        'surface-container-highest': '#C1C7D0',
        'outline': '#DFE1E6',
        'outline-variant': '#C1C7D0',
        'danger': '#EB5A46',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 0 rgba(9,30,66,0.25)',
        'card-lift': '0 4px 8px -2px rgba(9,30,66,0.25), 0 0 0 1px rgba(9,30,66,0.08)',
        popover: '0 8px 16px -4px rgba(9,30,66,0.25), 0 0 0 1px rgba(9,30,66,0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
