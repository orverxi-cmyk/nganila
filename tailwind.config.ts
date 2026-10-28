
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
        brandLight: '#d9eaa4',
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
          50: '#f9fcf3',
          100: '#f2f8e4',
          200: '#e6f2cb',
          300: '#d9eaa4', // Company Accent Light #d9eaa4
          400: '#c3dd74',
          500: '#a8cc49',
          600: '#83a532',
          700: '#647e29',
          800: '#506425',
          900: '#445523',
          950: '#24300f',
        },
        ocean: {
          50: '#f9fcf3',
          100: '#f2f8e4',
          200: '#e6f2cb',
          300: '#d9eaa4',
          400: '#c3dd74',
          500: '#d9eaa4',
          600: '#b8cf7a',
          700: '#83a532',
          800: '#506425',
          900: '#636679',
          950: '#26272e',
        },
        navy: {
          800: '#454755',
          900: '#636679',
          950: '#26272e',
        },
        brandCyan: {
          400: '#d9eaa4',
          500: '#c3dd74',
          600: '#a8cc49',
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
