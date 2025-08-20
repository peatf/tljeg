/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        bone: {
          50: '#fafbec',
          100: '#fafaf2',
          200: '#e1e1d7',
          300: '#afafa7',
          400: '#7c7d76',
          500: '#4b4c47'
        },
        ink: {
          50: '#f5f6f7',
          200: '#cfd3d8',
          400: '#8a94a3',
          600: '#4b5563',
          800: '#1f2937',
          900: '#111827'
        },
        slate: {
          100: '#f1f5f9',
          300: '#cbd5e1',
          500: '#64748b',
          700: '#334155'
        }
      },
      fontFamily: {
        grotesk: ["ui-sans-serif", "system-ui", "Inter", "Helvetica", "Arial", "sans-serif"],
        humanist: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"]
      }
    }
  },
  plugins: []
};
