import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'mc-bg': '#09090b',
        'mc-bg-secondary': '#111114',
        'mc-bg-tertiary': '#1a1a1f',
        'mc-bg-elevated': '#1e1e24',
        'mc-border': '#27272a',
        'mc-border-subtle': '#1e1e22',
        'mc-text': '#fafafa',
        'mc-text-secondary': '#71717a',
        'mc-text-muted': '#52525b',
        'mc-accent': '#58a6ff',
        'mc-accent-green': '#22c55e',
        'mc-accent-yellow': '#eab308',
        'mc-accent-red': '#ef4444',
        'mc-accent-purple': '#a78bfa',
        'mc-accent-pink': '#ec4899',
        'mc-accent-orange': '#f97316',
        'mc-accent-cyan': '#06b6d4',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
