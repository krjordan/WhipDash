import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { LiveDuration } from '../live-duration'
import { LiveStatusBadge } from '../live-status-badge'
import { SessionProvider } from '../../lib/session-context'

// Integration test component that includes both components
const IntegrationTestComponent = () => {
	return (
		<SessionProvider>
			<div>
				<LiveStatusBadge />
				<LiveDuration />
			</div>
		</SessionProvider>
	)
}

// Helper function to start a session (handles the modal workflow)
const startSession = async (user: ReturnType<typeof userEvent.setup>) => {
	// Open modal
	const startButton = screen.getByText('Start Session')
	await user.click(startButton)

	// Start session from modal
	const modalStartButtons = screen.getAllByText('Start Session')
	const modalStartButton = modalStartButtons[1] // Second one is in the modal
	await user.click(modalStartButton)
}

describe('LiveDuration and LiveStatusBadge Integration', () => {
	beforeEach(() => {
		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.runOnlyPendingTimers()
		jest.useRealTimers()
	})

	it('header badge updates when session is started', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		render(<IntegrationTestComponent />)

		// Initially should show "Ready"
		const headerBadge = screen.getByRole('status')
		expect(headerBadge).toHaveTextContent('Ready')
		expect(headerBadge).toHaveClass('text-blue-600', 'border-blue-600')

		// Start session
		await startSession(user)

		// Badge should now show "Live" with green pulsing
		expect(headerBadge).toHaveTextContent('Live')
		expect(headerBadge).toHaveClass(
			'text-green-600',
			'border-green-600',
			'animate-pulse'
		)
	})

	it('header badge updates when session is paused', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		render(<IntegrationTestComponent />)

		// Start session first
		await startSession(user)
		const headerBadge = screen.getByRole('status')
		expect(headerBadge).toHaveTextContent('Live')

		// Pause the session
		const pauseButton = screen.getByLabelText('Pause timer')
		await user.click(pauseButton)

		// Badge should now show "Paused" with yellow styling
		expect(headerBadge).toHaveTextContent('Paused')
		expect(headerBadge).toHaveClass('text-yellow-600', 'border-yellow-600')
	})

	it('header badge updates when session is resumed', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		render(<IntegrationTestComponent />)

		// Start session, pause, then resume
		await startSession(user)

		const headerBadge = screen.getByRole('status')
		const pauseButton = screen.getByLabelText('Pause timer')
		await user.click(pauseButton)
		expect(headerBadge).toHaveTextContent('Paused')

		const resumeButton = screen.getByLabelText('Resume timer')
		await user.click(resumeButton)

		// Badge should be back to "Live" with green pulsing
		expect(headerBadge).toHaveTextContent('Live')
		expect(headerBadge).toHaveClass(
			'text-green-600',
			'border-green-600',
			'animate-pulse'
		)
	})

	it('header badge updates when session is ended', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		render(<IntegrationTestComponent />)

		// Start session first
		await startSession(user)
		const headerBadge = screen.getByRole('status')
		expect(headerBadge).toHaveTextContent('Live')

		// End the session
		const endButton = screen.getByLabelText('End session')
		await user.click(endButton)

		// Badge should show "Ended" with gray styling
		expect(headerBadge).toHaveTextContent('Ended')
		expect(headerBadge).toHaveClass('text-gray-600', 'border-gray-600')
	})

	it('complete session workflow updates badge correctly', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		render(<IntegrationTestComponent />)

		const headerBadge = screen.getByRole('status')

		// 1. Initially ready
		expect(headerBadge).toHaveTextContent('Ready')

		// 2. Start session -> Live
		await startSession(user)
		expect(headerBadge).toHaveTextContent('Live')

		// 3. Pause -> Paused
		const pauseButton = screen.getByLabelText('Pause timer')
		await user.click(pauseButton)
		expect(headerBadge).toHaveTextContent('Paused')

		// 4. Resume -> Live
		const resumeButton = screen.getByLabelText('Resume timer')
		await user.click(resumeButton)
		expect(headerBadge).toHaveTextContent('Live')

		// 5. End -> Ended
		const endButton = screen.getByLabelText('End session')
		await user.click(endButton)
		expect(headerBadge).toHaveTextContent('Ended')
	})

	it('badge accessibility attributes are maintained during state changes', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		render(<IntegrationTestComponent />)

		// Check initial accessibility
		const headerBadge = screen.getByRole('status')
		expect(headerBadge).toHaveAttribute(
			'aria-label',
			'Dashboard status: Ready to start session'
		)

		// Start session and check accessibility
		await startSession(user)
		expect(headerBadge).toHaveAttribute(
			'aria-label',
			'Dashboard status: Live session active'
		)

		// Pause and check accessibility
		const pauseButton = screen.getByLabelText('Pause timer')
		await user.click(pauseButton)
		expect(headerBadge).toHaveAttribute(
			'aria-label',
			'Dashboard status: Session paused'
		)
	})
})
