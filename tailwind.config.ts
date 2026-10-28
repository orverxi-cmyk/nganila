
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        arial: ['Inter', 'system-ui', 'Arial', 'sans-serif'],
        body: ['Inter', 'system-ui', 'Arial', 'sans-serif'],
        headline: ['Inter', 'system-ui', 'Arial', 'sans-serif'],
      },
      colors: {
        brandDark: '#636679',
        brandLight: '#006400',
        brandGreen: '#006400',
        brandDarkGreen: '#005200',
        brandSlate: {
          50: '#f6f6f8',
          100: '#ececf0',
          200: '#d9dadf',
          300: '#bcbec8',
          400: '#9698a7',
          500: '#636679', // Company Primary Dark #636679
          600: '#545667',
          700: '#454755',
          800: '#383944',
          900: '#26272e',
          950: '#17181d',
        },
        brandSage: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#006400', // Company Green #006400
          950: '#004d00',
        },
        ocean: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#006400',
          600: '#005000',
          700: '#004000',
          800: '#003000',
          900: '#636679',
          950: '#26272e',
        },
        navy: {
          800: '#454755',
          900: '#636679',
          950: '#26272e',
        },
        brandCyan: {
          400: '#006400',
          500: '#005000',
          600: '#004000',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
