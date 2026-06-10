import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  safelist: [
    { pattern: /^bg-(red-(500|700)|orange-500|gray-400|emerald-500|blue-400|violet-400|amber-400)(\/\d+)?$/ },
    { pattern: /^text-(red-(500|700)|orange-500|gray-400|emerald-500|blue-400|violet-400|amber-400)$/ },
    { pattern: /^ring-(red-(500|700)|orange-500|gray-400|emerald-500|blue-400|violet-400|amber-400)$/ },
  ],
  theme: {
    extend: {
      colors: {
        wsa: {
          bg: 'rgb(var(--wsa-bg) / <alpha-value>)',
          card: 'rgb(var(--wsa-card) / <alpha-value>)',
          'card-inner': 'rgb(var(--wsa-card-inner) / <alpha-value>)',
          border: 'rgb(var(--wsa-border) / <alpha-value>)',
          text: 'rgb(var(--wsa-text) / <alpha-value>)',
          muted: 'rgb(var(--wsa-text-muted) / <alpha-value>)',
          disabled: 'rgb(var(--wsa-text-disabled) / <alpha-value>)',
          heading: 'rgb(var(--wsa-heading) / <alpha-value>)',
          gold: 'rgb(var(--wsa-gold) / <alpha-value>)',
          accent: 'rgb(var(--wsa-accent) / <alpha-value>)',
          'accent-soft': 'rgb(var(--wsa-accent-soft) / <alpha-value>)',
        },
        stat: {
          health: 'rgb(var(--stat-health) / <alpha-value>)',
          agility: 'rgb(var(--stat-agility) / <alpha-value>)',
          stamina: 'rgb(var(--stat-stamina) / <alpha-value>)',
          crit: 'rgb(var(--stat-crit) / <alpha-value>)',
          haste: 'rgb(var(--stat-haste) / <alpha-value>)',
          mastery: 'rgb(var(--stat-mastery) / <alpha-value>)',
          versatility: 'rgb(var(--stat-versatility) / <alpha-value>)',
        },
      },
      borderRadius: {
        'wsa-row': '8px',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      'business',
      'dracula',
      {
        'dark-leather': {
          'color-scheme': 'dark',
          primary: 'rgb(170 136 85)',
          'primary-content': 'rgb(224 208 176)',
          secondary: 'rgb(255 204 136)',
          'secondary-content': 'rgb(26 20 16)',
          accent: 'rgb(255 136 68)',
          'accent-content': 'rgb(26 20 16)',
          neutral: 'rgb(42 32 24)',
          'neutral-content': 'rgb(224 208 176)',
          'base-100': 'rgb(26 20 16)',
          'base-200': 'rgb(35 27 19)',
          'base-300': 'rgb(42 32 24)',
          'base-content': 'rgb(224 208 176)',
          info: 'rgb(136 204 255)',
          success: 'rgb(39 204 78)',
          warning: 'rgb(255 204 136)',
          error: 'rgb(255 68 68)',
        },
      },
    ],
  },
}
