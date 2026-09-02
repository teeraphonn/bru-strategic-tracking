/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C3BFF',
          dark: '#5521B5',
          light: '#EBE6FF',
        },
        secondary: '#FFFFFF',
        background: '#F8FAFC',
        // ── Semantic Design Tokens ──
        surface: {
          DEFAULT: '#FFFFFF',    // card backgrounds
          subtle:  '#F8FAFC',    // page canvas background
          muted:   '#F1F5F9',    // soft sections
        },
        muted: {
          DEFAULT: '#94A3B8',    // secondary text (replaces slate-400 scatter)
          strong:  '#64748B',    // slightly stronger muted text
        },
        'border-soft': '#E2E8F0', // consistent border color (replaces slate-100/slate-200 mix)
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],  // 10px — replaces text-[10px] hardcodes
      },
      borderRadius: {
        'xl': '12px',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03), 0 10px 15px -3px rgba(108, 59, 255, 0.05)',
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
      }
    },
  },
  plugins: [],
}
