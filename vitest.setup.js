import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    clear: () => {
      store = {};
    },
    getItem: vi.fn((key) => store[key] || null),
    removeItem: (key) => {
      delete store[key];
    },
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
