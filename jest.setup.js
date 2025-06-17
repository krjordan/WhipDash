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

// Suppress console warnings and errors in tests for cleaner output
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
	console.error = (...args) => {
		if (typeof args[0] === 'string') {
			// Suppress React act() warnings
			if (
				args[0].includes('An update to') &&
				args[0].includes('was not wrapped in act')
			) {
				return
			}
			// Suppress React testing environment warnings
			if (
				args[0].includes(
					'The current testing environment is not configured to support act'
				)
			) {
				return
			}
			// Suppress other React warnings
			if (
				args[0].includes('Warning: ReactDOM.render is no longer supported') ||
				args[0].includes('Warning: React does not recognize') ||
				args[0].includes('Warning: componentWillReceiveProps') ||
				args[0].includes('Warning: componentWillMount') ||
				args[0].includes('Warning: componentWillUpdate') ||
				args[0].includes('Warning: findDOMNode is deprecated') ||
				args[0].includes('Warning: Function components cannot be given refs')
			) {
				return
			}
		}
		originalError.call(console, ...args)
	}

	console.warn = (...args) => {
		if (typeof args[0] === 'string') {
			// Suppress common test warnings
			if (
				args[0].includes('ReactDOM.render is no longer supported') ||
				args[0].includes('React does not recognize') ||
				args[0].includes('componentWillReceiveProps') ||
				args[0].includes('componentWillMount') ||
				args[0].includes('componentWillUpdate') ||
				args[0].includes('findDOMNode is deprecated') ||
				args[0].includes('Function components cannot be given refs')
			) {
				return
			}
		}
		originalWarn.call(console, ...args)
	}
})

afterAll(() => {
	console.error = originalError
	console.warn = originalWarn
})

// Note: Timer setup is handled in individual test files
