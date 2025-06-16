import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { LiveDuration } from '../live-duration'

describe('LiveDuration Component', () => {
	beforeEach(() => {
		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.runOnlyPendingTimers()
		jest.useRealTimers()
	})

	it('renders with initial state', () => {
		render(<LiveDuration />)

		expect(screen.getByText('Live Duration')).toBeInTheDocument()
		expect(screen.getByText('0:00')).toBeInTheDocument()
		expect(
			screen.getByText((content, element) => {
				return element?.textContent === '0% of goal (30 min remaining)'
			})
		).toBeInTheDocument()
		expect(screen.getByText('Live')).toBeInTheDocument()
	})

	it('counts up every second when running', () => {
		render(<LiveDuration />)

		expect(screen.getByText('0:00')).toBeInTheDocument()

		act(() => {
			jest.advanceTimersByTime(1000)
		})

		expect(screen.getByText('0:01')).toBeInTheDocument()

		act(() => {
			jest.advanceTimersByTime(59000) // 59 more seconds
		})

		expect(screen.getByText('1:00')).toBeInTheDocument()
	})

	it('pauses and resumes timer correctly', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		render(<LiveDuration />)

		// Timer should start running
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
	})

	it('ends session correctly', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		render(<LiveDuration />)

		// Let timer run for a bit
		act(() => {
			jest.advanceTimersByTime(10000)
		})
		expect(screen.getByText('0:10')).toBeInTheDocument()

		// End the session
		const endButton = screen.getByLabelText('End session')
		await user.click(endButton)

		expect(screen.getByText('Session Ended')).toBeInTheDocument()

		// Timer should not advance when ended
		act(() => {
			jest.advanceTimersByTime(5000)
		})
		expect(screen.getByText('0:10')).toBeInTheDocument()

		// Should show restart button
		expect(screen.getByLabelText('Restart session')).toBeInTheDocument()
	})

	it('restarts session correctly', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		render(<LiveDuration />)

		// Run timer and end session
		act(() => {
			jest.advanceTimersByTime(10000)
		})

		const endButton = screen.getByLabelText('End session')
		await user.click(endButton)

		expect(screen.getByText('0:10')).toBeInTheDocument()
		expect(screen.getByText('Session Ended')).toBeInTheDocument()

		// Restart session
		const restartButton = screen.getByLabelText('Restart session')
		await user.click(restartButton)

		expect(screen.getByText('0:00')).toBeInTheDocument()
		expect(screen.getByText('Live')).toBeInTheDocument()

		// Timer should start counting again
		act(() => {
			jest.advanceTimersByTime(3000)
		})
		expect(screen.getByText('0:03')).toBeInTheDocument()
	})

	it('calculates progress percentage correctly', () => {
		render(<LiveDuration />)

		// Default goal is 30 minutes (1800 seconds)
		act(() => {
			jest.advanceTimersByTime(180000) // 3 minutes = 180 seconds
		})

		// 180 / 1800 = 0.1 = 10.0%
		expect(
			screen.getByText((content, element) => {
				return element?.textContent === '10% of goal (27 min remaining)'
			})
		).toBeInTheDocument()
	})

	it('calculates remaining time correctly', () => {
		render(<LiveDuration />)

		act(() => {
			jest.advanceTimersByTime(300000) // 5 minutes
		})

		// 30 min goal - 5 min elapsed = 25 min remaining (16.666% rounds to 16.6%)
		expect(
			screen.getByText((content, element) => {
				return element?.textContent === '16.6% of goal (25 min remaining)'
			})
		).toBeInTheDocument()
	})

	it('changes goal duration and recalculates progress', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		render(<LiveDuration />)

		// Run timer for 5 minutes
		act(() => {
			jest.advanceTimersByTime(300000)
		})

		// Initially 30 min goal: 5/30 = 16.6%
		expect(
			screen.getByText((content, element) => {
				return element?.textContent === '16.6% of goal (25 min remaining)'
			})
		).toBeInTheDocument()

		// Pause to allow goal change
		const pauseButton = screen.getByLabelText('Pause timer')
		await user.click(pauseButton)

		// Change goal to 15 minutes
		const goalSelect = screen.getByRole('combobox')
		await user.click(goalSelect)
		await user.click(screen.getByText('15 min'))

		// New calculation: 5/15 = 33.3%
		expect(
			screen.getByText((content, element) => {
				return element?.textContent === '33.3% of goal (10 min remaining)'
			})
		).toBeInTheDocument()
		expect(screen.getByText('15:00')).toBeInTheDocument() // Progress bar end time
	})

	it('shows correct progress bar colors based on time', () => {
		render(<LiveDuration />)

		// Green for under 5 minutes
		act(() => {
			jest.advanceTimersByTime(240000) // 4 minutes
		})
		expect(screen.getByRole('progressbar')).toHaveClass('bg-green-500')

		// Yellow for 5-15 minutes
		act(() => {
			jest.advanceTimersByTime(360000) // +6 minutes = 10 minutes total
		})
		expect(screen.getByRole('progressbar')).toHaveClass('bg-yellow-500')

		// Orange for 15-30 minutes
		act(() => {
			jest.advanceTimersByTime(600000) // +10 minutes = 20 minutes total
		})
		expect(screen.getByRole('progressbar')).toHaveClass('bg-orange-500')

		// Red for 30+ minutes
		act(() => {
			jest.advanceTimersByTime(660000) // +11 minutes = 31 minutes total
		})
		expect(screen.getByRole('progressbar')).toHaveClass('bg-red-500')
	})

	it('shows correct status indicators', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		render(<LiveDuration />)

		// Initially live (green pulsing)
		const liveIndicator = screen.getByText('Live').previousElementSibling
		expect(liveIndicator).toHaveClass('bg-green-500', 'animate-pulse')

		// Pause (yellow)
		const pauseButton = screen.getByLabelText('Pause timer')
		await user.click(pauseButton)

		const pausedIndicator = screen.getByText('Paused').previousElementSibling
		expect(pausedIndicator).toHaveClass('bg-yellow-500')

		// End (gray)
		const resumeButton = screen.getByLabelText('Resume timer')
		await user.click(resumeButton) // Resume first

		const endButton = screen.getByLabelText('End session')
		await user.click(endButton)

		const endedIndicator =
			screen.getByText('Session Ended').previousElementSibling
		expect(endedIndicator).toHaveClass('bg-gray-500')
	})

	it('prevents goal changes during active session', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		render(<LiveDuration />)

		// Goal selector should be disabled during active session
		const goalSelect = screen.getByRole('combobox')
		expect(goalSelect).toBeDisabled()

		// Pause to enable goal changes
		const pauseButton = screen.getByLabelText('Pause timer')
		await user.click(pauseButton)

		expect(goalSelect).not.toBeDisabled()
	})

	it('displays goal options correctly', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		render(<LiveDuration />)

		// Pause to enable goal selector
		const pauseButton = screen.getByLabelText('Pause timer')
		await user.click(pauseButton)

		const goalSelect = screen.getByRole('combobox')
		await user.click(goalSelect)

		// Wait for dropdown to open and check all goal options are present
		expect(await screen.findByText('15 min')).toBeInTheDocument()

		// Use getAllByText to handle multiple instances and verify both exist
		const thirtyMinOptions = screen.getAllByText('30 min')
		expect(thirtyMinOptions).toHaveLength(2) // One in trigger, one in dropdown

		expect(screen.getByText('1 hour')).toBeInTheDocument()
		expect(screen.getByText('2 hours')).toBeInTheDocument()
		expect(screen.getByText('4 hours')).toBeInTheDocument()
	})

	it('handles edge case when time exceeds goal', () => {
		render(<LiveDuration />)

		// Run timer beyond the 30-minute goal
		act(() => {
			jest.advanceTimersByTime(2400000) // 40 minutes
		})

		// Progress should cap at 100%
		expect(
			screen.getByText((content, element) => {
				return element?.textContent === '100% of goal (0 min remaining)'
			})
		).toBeInTheDocument()
	})

	it('shows progress bar width correctly', () => {
		render(<LiveDuration />)

		// 25% progress (7.5 minutes of 30 minutes)
		act(() => {
			jest.advanceTimersByTime(450000) // 7.5 minutes
		})

		const progressBar = screen.getByRole('progressbar')
		expect(progressBar).toHaveStyle('width: 25%')
	})
})
