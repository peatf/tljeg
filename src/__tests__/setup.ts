// Extend expect with jest-dom matchers under Vitest
import '@testing-library/jest-dom/vitest';

// Basic matchMedia polyfill for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false
  })
});

// Mock SVG imports for tests
vi.mock('*.svg?react', () => {
  const React = require('react');
  return {
    default: React.forwardRef((props, ref) => 
      React.createElement('div', { 
        'data-testid': 'svg-mock',
        ref,
        ...props 
      }, 'svg-mock')
    )
  };
});

// Mock specific SVG files
vi.mock('../assets/safety.svg?react', () => {
  const React = require('react');
  return {
    default: React.forwardRef((props, ref) => 
      React.createElement('div', { 
        'data-testid': 'safety-svg-mock',
        ref,
        ...props 
      }, 'safety-svg-mock')
    )
  };
});
