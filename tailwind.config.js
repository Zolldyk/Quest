/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './app/**/*.{js,ts,jsx,tsx,mdx}',
      './Frontend/src/**/*.{js,ts,jsx,tsx,mdx}',
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        // Custom color palette for Quest dApp
        colors: {
          // Primary brand colors
          primary: {
            50: '#f0f9ff',
            100: '#e0f2fe', 
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e',
          },
          // Secondary accent colors
          secondary: {
            50: '#fdf4ff',
            100: '#fae8ff',
            200: '#f5d0fe',
            300: '#f0abfc',
            400: '#e879f9',
            500: '#d946ef',
            600: '#c026d3',
            700: '#a21caf',
            800: '#86198f',
            900: '#701a75',
          },
          // Success/reward colors
          success: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
          },
          // Warning colors
          warning: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
          },
          // Error colors
          error: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
          },
          // Neutral grays
          neutral: {
            50: '#fafafa',
            100: '#f5f5f5',
            200: '#e5e5e5',
            300: '#d4d4d4',
            400: '#a3a3a3',
            500: '#737373',
            600: '#525252',
            700: '#404040',
            800: '#262626',
            900: '#171717',
          },
        },
        
        // Custom fonts
        fontFamily: {
          sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
          mono: ['Fira Code', 'JetBrains Mono', 'Consolas', 'monospace'],
          display: ['Inter', 'system-ui', 'sans-serif'],
        },
        
        // Custom spacing
        spacing: {
          '18': '4.5rem',
          '88': '22rem',
          '128': '32rem',
        },
        
        // Custom border radius
        borderRadius: {
          '4xl': '2rem',
          '5xl': '2.5rem',
        },
        
        // Custom shadows
        boxShadow: {
          'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
          'glow-lg': '0 0 40px rgba(59, 130, 246, 0.4)',
          'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          'card-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
        
        // Custom animations
        animation: {
          'fade-in': 'fadeIn 0.5s ease-in-out',
          'slide-up': 'slideUp 0.3s ease-out',
          'slide-down': 'slideDown 0.3s ease-out',
          'bounce-gentle': 'bounceGentle 2s infinite',
          'pulse-slow': 'pulse 3s infinite',
          'spin-slow': 'spin 3s linear infinite',
          'float': 'float 3s ease-in-out infinite',
        },
        
        // Custom keyframes
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          slideUp: {
            '0%': { transform: 'translateY(100%)' },
            '100%': { transform: 'translateY(0)' },
          },
          slideDown: {
            '0%': { transform: 'translateY(-100%)' },
            '100%': { transform: 'translateY(0)' },
          },
          bounceGentle: {
            '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
            '40%': { transform: 'translateY(-10px)' },
            '60%': { transform: 'translateY(-5px)' },
          },
          float: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-10px)' },
          },
        },
        
        // Custom gradients
        backgroundImage: {
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
          'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
          'hero-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          'card-gradient': 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
          'dark-gradient': 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
        },
        
        // Custom backdrop blur
        backdropBlur: {
          xs: '2px',
        },
        
        // Custom aspect ratios
        aspectRatio: {
          '4/3': '4 / 3',
          '3/2': '3 / 2',
          '2/3': '2 / 3',
          '9/16': '9 / 16',
        },
        
        // Custom screens for responsive design
        screens: {
          'xs': '475px',
          '3xl': '1600px',
        },
        
        // Custom z-index values
        zIndex: {
          '60': '60',
          '70': '70',
          '80': '80',
          '90': '90',
          '100': '100',
        },
      },
    },
    plugins: [
      
      // Custom plugin for glassmorphism effect
      function({ addUtilities }) {
        const newUtilities = {
          '.glass': {
            'background': 'rgba(255, 255, 255, 0.1)',
            'backdrop-filter': 'blur(10px)',
            'border': '1px solid rgba(255, 255, 255, 0.2)',
          },
          '.glass-dark': {
            'background': 'rgba(0, 0, 0, 0.1)',
            'backdrop-filter': 'blur(10px)',
            'border': '1px solid rgba(255, 255, 255, 0.1)',
          },
          '.text-gradient': {
            'background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'background-clip': 'text',
            '-webkit-background-clip': 'text',
            '-webkit-text-fill-color': 'transparent',
          },
          '.btn-glow': {
            'box-shadow': '0 0 20px rgba(59, 130, 246, 0.3)',
            'transition': 'all 0.3s ease',
          },
          '.btn-glow:hover': {
            'box-shadow': '0 0 30px rgba(59, 130, 246, 0.5)',
            'transform': 'translateY(-2px)',
          },
        }
        addUtilities(newUtilities)
      }
    ],
    // Dark mode configuration
    darkMode: 'class',
  }