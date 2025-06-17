import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { LiveDuration } from '../live-duration'
import { SessionProvider } from '../../lib/session-context'

// Test helper to wrap component with SessionProvider
const renderWithSessionProvider = (ui: React.ReactElement) => {
	return render(<SessionProvider>{ui}</SessionProvider>)
}

// Helper function to start a session (handles the modal workflow)
const startSession = async (user: ReturnType<typeof userEvent.setup>) => {
	// Open modal
	const startButton = screen.getByText('Start Session')
	await user.click(startButton)

	// Start session from modal (get all buttons and choose the modal one)
	const modalStartButtons = screen.getAllByText('Start Session')
	const modalStartButton = modalStartButtons[1] // Second one is in the modal
	await user.click(modalStartButton)
}

describe('LiveDuration Component', () => {
	beforeEach(() => {
		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.runOnlyPendingTimers()
		jest.useRealTimers()
	})

	it('renders with initial state', () => {
		renderWithSessionProvider(<LiveDuration />)

		expect(screen.getByText('Live Duration')).toBeInTheDocument()
		expect(screen.getByText('0:00')).toBeInTheDocument()
		expect(
			screen.getByText((content, element) => {
				return element?.textContent === '0% of goal (120 min remaining)'
			})
		).toBeInTheDocument()
		expect(screen.getByText('Ready to Start')).toBeInTheDocument()
		expect(screen.getByText('Start Session')).toBeInTheDocument()
	})

	it('shows modal when start session is clicked', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderWithSessionProvider(<LiveDuration />)

		const startButton = screen.getByText('Start Session')
		await user.click(startButton)

		expect(screen.getByText('Start New Session')).toBeInTheDocument()
		expect(screen.getByText('Duration Goal')).toBeInTheDocument()
		expect(screen.getByText('Sales Goal ($)')).toBeInTheDocument()
	})

	it('starts session and begins counting after modal', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderWithSessionProvider(<LiveDuration />)

		await startSession(user)

		// Should show live state
		expect(screen.getByText('Live')).toBeInTheDocument()
		expect(screen.getByText('0:00')).toBeInTheDocument()

		// Timer should count up
		act(() => {
			jest.advanceTimersByTime(5000)
		})
		expect(screen.getByText('0:05')).toBeInTheDocument()
	})

	it('pauses and resumes timer correctly', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderWithSessionProvider(<LiveDuration />)

		await startSession(user)

		// Let timer run
		act(() => {
			jest.advanceTimersByTime(5000)
		})
		expect(screen.getByText('0:05')).toBeInTheDocument()

		// Pause the timer
		const pauseButton = screen.getByLabelText('Pause timer')
		await user.click(pauseButton)

		expect(screen.getByText('Paused')).toBeInTheDocument()

		// Time should not advance when paused
		act(() => {
			jest.advanceTimersByTime(3000)
		})
		expect(screen.getByText('0:05')).toBeInTheDocument()

		// Resume the timer
		const resumeButton = screen.getByLabelText('Resume timer')
		await user.click(resumeButton)

		expect(screen.getByText('Live')).toBeInTheDocument()

		// Timer should continue
		act(() => {
			jest.advanceTimersByTime(2000)
		})
		expect(screen.getByText('0:07')).toBeInTheDocument()
	})

	it('ends session correctly', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderWithSessionProvider(<LiveDuration />)

		await startSession(user)

		// Let timer run for a bit
		act(() => {
			jest.advanceTimersByTime(10000)
		})
		expect(screen.getByText('0:10')).toBeInTheDocument()

		// End the session
		const endButton = screen.getByLabelText('End session')
		await user.click(endButton)

		expect(screen.getByText('Ready to Start')).toBeInTheDocument()

		// Timer should not advance when ended
		act(() => {
			jest.advanceTimersByTime(5000)
		})
		expect(screen.getByText('0:00')).toBeInTheDocument() // Should reset to 0:00

		// Should show start session button again
		expect(screen.getByText('Start Session')).toBeInTheDocument()
	})

	it('calculates progress percentage correctly with 2-hour default', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderWithSessionProvider(<LiveDuration />)

		await startSession(user)

		// Default goal is 2 hours (7200 seconds)
		// Run for 12 minutes = 720 seconds
		act(() => {
			jest.advanceTimersByTime(720000) // 12 minutes
		})

		// 720 / 7200 = 0.1 = 10.0%
		expect(
			screen.getByText((content, element) => {
				return element?.textContent === '10% of goal (108 min remaining)'
			})
		).toBeInTheDocument()
	})

	it('shows correct progress bar colors based on goal progress', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderWithSessionProvider(<LiveDuration />)

		await startSession(user)

		// Red for early progress (0-40% of 2-hour goal)
		act(() => {
			jest.advanceTimersByTime(1440000) // 24 minutes = 20% of 2-hour goal
		})
		expect(screen.getByRole('progressbar')).toHaveClass('bg-red-500')

		// Orange for moderate progress (40-70% of goal)
		act(() => {
			jest.advanceTimersByTime(2160000) // +36 minutes = 60 minutes total = 50% of goal
		})
		expect(screen.getByRole('progressbar')).toHaveClass('bg-orange-500')

		// Yellow for good progress (70-90% of goal)
		act(() => {
			jest.advanceTimersByTime(1800000) // +30 minutes = 90 minutes total = 75% of goal
		})
		expect(screen.getByRole('progressbar')).toHaveClass('bg-yellow-500')

		// Green for excellent progress (90%+ of goal)
		act(() => {
			jest.advanceTimersByTime(1080000) // +18 minutes = 108 minutes total = 90% of goal
		})
		expect(screen.getByRole('progressbar')).toHaveClass('bg-green-500')
	})

	it('shows correct status indicators', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderWithSessionProvider(<LiveDuration />)

		// Initially ready to start
		const readyIndicator =
			screen.getByText('Ready to Start').previousElementSibling
		expect(readyIndicator).toHaveClass('bg-gray-400')

		await startSession(user)

		// Should show live (green pulsing)
		const liveIndicator = screen.getByText('Live').previousElementSibling
		expect(liveIndicator).toHaveClass('bg-green-500', 'animate-pulse')

		// Pause (yellow)
		const pauseButton = screen.getByLabelText('Pause timer')
		await user.click(pauseButton)

		const pausedIndicator = screen.getByText('Paused').previousElementSibling
		expect(pausedIndicator).toHaveClass('bg-yellow-500')

		// Resume first
		const resumeButton = screen.getByLabelText('Resume timer')
		await user.click(resumeButton)

		// End the session
		const endButton = screen.getByLabelText('End session')
		await user.click(endButton)

		// Should be back to ready state
		const readyIndicatorAfterEnd =
			screen.getByText('Ready to Start').previousElementSibling
		expect(readyIndicatorAfterEnd).toHaveClass('bg-gray-400')
	})

	it('displays session info during active session', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderWithSessionProvider(<LiveDuration />)

		await startSession(user)

		// Should show session info
		expect(screen.getByText('Goal: 2:00:00')).toBeInTheDocument()
	})

	it('handles goal changes in modal', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderWithSessionProvider(<LiveDuration />)

		// Open modal
		const startButton = screen.getByText('Start Session')
		await user.click(startButton)

		// Change to 1 hour goal
		const selectTrigger = screen.getByRole('combobox')
		await user.click(selectTrigger)

		const oneHourOption = screen.getByText('1 hour')
		await user.click(oneHourOption)

		// Start session
		const modalStartButtons = screen.getAllByText('Start Session')
		const modalStartButton = modalStartButtons[1]
		await user.click(modalStartButton)

		// Should show 1 hour (60 minutes) remaining
		expect(
			screen.getByText((content, element) => {
				return element?.textContent === '0% of goal (60 min remaining)'
			})
		).toBeInTheDocument()
	})

	it('handles edge case when time exceeds goal', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderWithSessionProvider(<LiveDuration />)

		// Open modal
		const startButton = screen.getByText('Start Session')
		await user.click(startButton)

		// Change to 15 min goal (smallest option)
		const selectTrigger = screen.getByRole('combobox')
		await user.click(selectTrigger)

		const fifteenMinOption = screen.getByText('15 min')
		await user.click(fifteenMinOption)

		// Start session
		const modalStartButtons = screen.getAllByText('Start Session')
		const modalStartButton = modalStartButtons[1]
		await user.click(modalStartButton)

		// Run for 20 minutes (exceeding the 15 min goal)
		act(() => {
			jest.advanceTimersByTime(1200000) // 20 minutes
		})

		// Progress should show 100% of goal with 0 min remaining
		expect(
			screen.getByText((content, element) => {
				return element?.textContent === '100% of goal (0 min remaining)'
			})
		).toBeInTheDocument()

		expect(screen.getByText('20:00')).toBeInTheDocument()
	})
})
