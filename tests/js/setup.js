// Jest setup file for Fortune Teller tests

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: jest.fn((index) => {
            const keys = Object.keys(store);
            return keys[index] || null;
        }),
        // Helper to get raw store for testing
        _getStore: () => store,
        _setStore: (newStore) => { store = newStore; }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Reset localStorage before each test
beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
});

// Helper function to set a fixed date for testing
global.setMockDate = (dateString) => {
    const mockDate = new Date(dateString);
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
};

// Helper to restore real timers
global.restoreMockDate = () => {
    jest.useRealTimers();
};

// Console warning suppression for expected warnings
global.suppressConsoleWarn = () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
};
