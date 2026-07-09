import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        body: ['PT Sans', 'sans-serif'],
        headline: ['Poppins', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        // Design System — semantic status renkleri (ek, mevcut renkleri değiştirmez)
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        neutral: {
          DEFAULT: 'hsl(var(--neutral))',
          foreground: 'hsl(var(--neutral-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
      },
      // Design System — elevation (shadow) ölçeği. Var olan `shadow-*`
      // sınıflarını değiştirmez; `shadow-elevation-*` adıyla ek/opsiyonel
      // semantic seviyeler tanımlar.
      boxShadow: {
        'elevation-low': '0 1px 2px 0 hsl(var(--shadow-color) / 0.06)',
        'elevation-medium':
          '0 4px 12px -2px hsl(var(--shadow-color) / 0.12), 0 2px 4px -2px hsl(var(--shadow-color) / 0.08)',
        'elevation-high':
          '0 12px 24px -4px hsl(var(--shadow-color) / 0.18), 0 4px 8px -2px hsl(var(--shadow-color) / 0.1)',
      },
      // Design System — spacing ölçeği. `ds-*` önekiyle eklendi; mevcut
      // sayısal spacing sınıflarını (p-4, gap-2 vb.) etkilemez.
      spacing: {
        'ds-1': 'var(--space-1)',
        'ds-2': 'var(--space-2)',
        'ds-3': 'var(--space-3)',
        'ds-4': 'var(--space-4)',
        'ds-6': 'var(--space-6)',
        'ds-8': 'var(--space-8)',
        'ds-12': 'var(--space-12)',
        'ds-16': 'var(--space-16)',
      },
      // Design System — typography ölçeği. Semantic isimler; mevcut
      // text-sm/text-lg vb. sınıfları aynen çalışmaya devam eder.
      fontSize: {
        'ds-caption': ['0.75rem', { lineHeight: '1rem' }],
        'ds-body-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'ds-body': ['1rem', { lineHeight: '1.5rem' }],
        'ds-body-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'ds-h4': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'ds-h3': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        'ds-h2': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        'ds-h1': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        'ds-display': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
