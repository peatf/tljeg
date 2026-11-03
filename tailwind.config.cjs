/** @type {import('tailwindcss').Config} */
// One warm-neutral family plus the cobalt of the pixel-stitch drawings.
// slate and stone are mapped onto the same neutrals so older utility classes
// stay in palette instead of drifting cool or grey.
const neutral = {
  25: '#fbfbf4',
  50: '#f7f7ee',
  100: '#eeeee2',
  200: '#e1e1d4',
  300: '#c9c9bb',
  400: '#a3a497',
  500: '#7e7f73',
  600: '#5f6056',
  700: '#46473f',
  800: '#2f302a',
  900: '#22231f'
};

module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        bone: {
          50: '#fbfbf4',
          100: '#eeeee2',
          200: '#e1e1d4',
          300: '#c9c9bb',
          400: '#a3a497',
          500: '#7e7f73',
          700: '#46473f',
          800: '#2f302a'
        },
        ink: neutral,
        slate: neutral,
        stone: neutral,
        zinc: neutral,
        gray: neutral,
        cobalt: {
          50: '#eef3fc',
          100: '#dbe6f8',
          300: '#8fb0ea',
          500: '#0e5cc8',
          600: '#0b4fae',
          700: '#093f8b'
        }
      },
      fontFamily: {
        grotesk: ['"Work Sans"', "ui-sans-serif", "system-ui", "Helvetica", "Arial", "sans-serif"],
        humanist: ['"Work Sans"', "ui-sans-serif", "system-ui", "Helvetica", "Arial", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      }
    }
  },
  plugins: []
};
