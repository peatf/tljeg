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
