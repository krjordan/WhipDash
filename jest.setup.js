import '@testing-library/jest-dom'

// Mock next-themes
jest.mock('next-themes', () => ({
	useTheme: () => ({
		theme: 'light',
		setTheme: jest.fn(),
		resolvedTheme: 'light'
	}),
	ThemeProvider: ({ children }) => children
}))

// Mock browser APIs that Radix UI needs but JSDOM doesn't support
global.HTMLElement.prototype.hasPointerCapture = jest.fn()
global.HTMLElement.prototype.setPointerCapture = jest.fn()
global.HTMLElement.prototype.releasePointerCapture = jest.fn()

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn()
}))

// Mock ConfettiCelebration component for tests (since it requires canvas)
jest.mock('@/components/confetti-celebration', () => ({
	ConfettiCelebration: ({ isActive, onComplete }) => {
		// Simulate confetti completion in tests
		if (isActive && onComplete) {
			setTimeout(onComplete, 100)
		}
		return null
	}
}))

// Suppress React act() warnings in tests
const originalError = console.error
beforeAll(() => {
	console.error = (...args) => {
		if (
			typeof args[0] === 'string' &&
			args[0].includes('An update to') &&
			args[0].includes('was not wrapped in act')
		) {
			return
		}
		originalError.call(console, ...args)
	}
})

afterAll(() => {
	console.error = originalError
})

// Note: Timer setup is handled in individual test files
