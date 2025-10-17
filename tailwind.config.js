/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx}',
    './src/providers/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        
        // Surfaces (iOS-style layering)
        surface: {
          base: 'var(--surface-base)',
          elevated: 'var(--surface-elevated)',
          'elevated-hover': 'var(--surface-elevated-hover)',
          card: 'var(--surface-card)',
          'card-hover': 'var(--surface-card-hover)',
        },
        
        // Accent (refined emerald)
        accent: {
          primary: 'var(--accent-primary)',
          hover: 'var(--accent-hover)',
          light: 'var(--accent-light)',
        },
        
        // Status (subtle indicators)
        status: {
          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          error: 'var(--status-error)',
          info: 'var(--status-info)',
        },
        
        // Borders (refined)
        border: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
      },
      fontFamily: {
        'dongraffiti': ['DonGraffiti', 'sans-serif'],
        'tiempo': ['Tiempo', 'serif'],
        'sans': ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Cascadia Code', 'Courier New', 'monospace'],
      },
      fontSize: {
        // iOS-style type scale
        'display': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'title-1': ['28px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'title-2': ['22px', { lineHeight: '1.35', letterSpacing: '-0.005em', fontWeight: '600' }],
        'title-3': ['20px', { lineHeight: '1.4', fontWeight: '500' }],
        'headline': ['17px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption-1': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        'caption-2': ['11px', { lineHeight: '1.35', fontWeight: '400' }],
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'elevated': '0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'ios': '10px',
        'ios-sm': '8px',
        'ios-lg': '12px',
        'ios-xl': '16px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out',
        'slideIn': 'slideIn 0.3s ease-out',
        'shimmer': 'shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
      transitionTimingFunction: {
        'ios': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  },
  mode: 'jit',
}
