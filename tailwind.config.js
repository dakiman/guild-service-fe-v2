import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  safelist: [
    { pattern: /^bg-(red-(500|700)|orange-500|gray-400|emerald-500|blue-400|violet-400|amber-400)$/ },
    { pattern: /^text-(red-(500|700)|orange-500|gray-400|emerald-500|blue-400|violet-400|amber-400)$/ },
  ],
  theme: {
    extend: {
      colors: {
        // Masked-armory tokens; values come from src/style.css `:root` so the
        // CSS variables stay the single source of truth.
        ma: {
          bg: 'rgb(var(--ma-bg) / <alpha-value>)',
          card: 'rgb(var(--ma-card) / <alpha-value>)',
          'card-inner': 'rgb(var(--ma-card-inner) / <alpha-value>)',
          border: 'rgb(var(--ma-border) / <alpha-value>)',
          text: 'rgb(var(--ma-text) / <alpha-value>)',
          muted: 'rgb(var(--ma-text-muted) / <alpha-value>)',
          disabled: 'rgb(var(--ma-text-disabled) / <alpha-value>)',
          heading: 'rgb(var(--ma-heading) / <alpha-value>)',
          gold: 'rgb(var(--ma-gold) / <alpha-value>)',
          violet: 'rgb(var(--ma-violet) / <alpha-value>)',
          'violet-soft': 'rgb(var(--ma-violet-soft) / <alpha-value>)',
          amber: 'rgb(var(--ma-amber) / <alpha-value>)',
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
        'ma-row': '8px',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      'business',
      'dracula',
      {
        'masked-armory': {
          'color-scheme': 'dark',
          primary: 'rgb(139 92 246)',
          'primary-content': 'rgb(241 232 255)',
          secondary: 'rgb(167 139 250)',
          'secondary-content': 'rgb(3 1 8)',
          accent: 'rgb(255 217 85)',
          'accent-content': 'rgb(3 1 8)',
          neutral: 'rgb(26 15 46)',
          'neutral-content': 'rgb(241 232 255)',
          'base-100': 'rgb(3 1 8)',
          'base-200': 'rgb(18 11 30)',
          'base-300': 'rgb(26 15 46)',
          'base-content': 'rgb(241 232 255)',
          info: 'rgb(167 139 250)',
          success: 'rgb(39 204 78)',
          warning: 'rgb(255 217 85)',
          error: 'rgb(224 28 28)',
        },
      },
    ],
  },
}
