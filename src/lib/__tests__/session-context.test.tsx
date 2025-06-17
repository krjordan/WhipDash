import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { SessionProvider, useSession } from '../session-context'

// Test component that uses the session context
const TestComponent = () => {
	const {
		sessionState,
		startSession,
		pauseSession,
		resumeSession,
		endSession
	} = useSession()

	return (
		<div>
			<div data-testid="status">{sessionState.status}</div>
			<div data-testid="isStarted">{sessionState.isStarted.toString()}</div>
			<div data-testid="isRunning">{sessionState.isRunning.toString()}</div>
			<div data-testid="isEnded">{sessionState.isEnded.toString()}</div>

			<button
				onClick={startSession}
				data-testid="start"
			>
				Start
			</button>
			<button
				onClick={pauseSession}
				data-testid="pause"
			>
				Pause
			</button>
			<button
				onClick={resumeSession}
				data-testid="resume"
			>
				Resume
			</button>
			<button
				onClick={endSession}
				data-testid="end"
			>
				End
			</button>
		</div>
	)
}

const renderWithProvider = () => {
	return render(
		<SessionProvider>
			<TestComponent />
		</SessionProvider>
	)
}

describe('SessionContext', () => {
	it('provides initial state correctly', () => {
		renderWithProvider()

		expect(screen.getByTestId('status')).toHaveTextContent('ready')
		expect(screen.getByTestId('isStarted')).toHaveTextContent('false')
		expect(screen.getByTestId('isRunning')).toHaveTextContent('false')
		expect(screen.getByTestId('isEnded')).toHaveTextContent('false')
	})

	it('handles startSession correctly', async () => {
		const user = userEvent.setup()
		renderWithProvider()

		await act(async () => {
			await user.click(screen.getByTestId('start'))
		})

		expect(screen.getByTestId('status')).toHaveTextContent('live')
		expect(screen.getByTestId('isStarted')).toHaveTextContent('true')
		expect(screen.getByTestId('isRunning')).toHaveTextContent('true')
		expect(screen.getByTestId('isEnded')).toHaveTextContent('false')
	})

	it('handles pauseSession correctly', async () => {
		const user = userEvent.setup()
		renderWithProvider()

		// Start session first
		await act(async () => {
			await user.click(screen.getByTestId('start'))
		})

		// Then pause
		await act(async () => {
			await user.click(screen.getByTestId('pause'))
		})

		expect(screen.getByTestId('status')).toHaveTextContent('paused')
		expect(screen.getByTestId('isStarted')).toHaveTextContent('true') // Still started
		expect(screen.getByTestId('isRunning')).toHaveTextContent('false') // But not running
		expect(screen.getByTestId('isEnded')).toHaveTextContent('false')
	})

	it('handles resumeSession correctly', async () => {
		const user = userEvent.setup()
		renderWithProvider()

		// Start, pause, then resume
		await act(async () => {
			await user.click(screen.getByTestId('start'))
			await user.click(screen.getByTestId('pause'))
			await user.click(screen.getByTestId('resume'))
		})

		expect(screen.getByTestId('status')).toHaveTextContent('live')
		expect(screen.getByTestId('isStarted')).toHaveTextContent('true')
		expect(screen.getByTestId('isRunning')).toHaveTextContent('true')
		expect(screen.getByTestId('isEnded')).toHaveTextContent('false')
	})

	it('handles endSession correctly', async () => {
		const user = userEvent.setup()
		renderWithProvider()

		// Start session first, then end it
		await act(async () => {
			await user.click(screen.getByTestId('start'))
			await user.click(screen.getByTestId('end'))
		})

		expect(screen.getByTestId('status')).toHaveTextContent('ended')
		expect(screen.getByTestId('isStarted')).toHaveTextContent('false')
		expect(screen.getByTestId('isRunning')).toHaveTextContent('false')
		expect(screen.getByTestId('isEnded')).toHaveTextContent('true')
	})

	it('handles complex session workflow', async () => {
		const user = userEvent.setup()
		renderWithProvider()

		// Complete workflow: start -> pause -> resume -> end
		await act(async () => {
			// Start
			await user.click(screen.getByTestId('start'))
		})
		expect(screen.getByTestId('status')).toHaveTextContent('live')

		await act(async () => {
			// Pause
			await user.click(screen.getByTestId('pause'))
		})
		expect(screen.getByTestId('status')).toHaveTextContent('paused')

		await act(async () => {
			// Resume
			await user.click(screen.getByTestId('resume'))
		})
		expect(screen.getByTestId('status')).toHaveTextContent('live')

		await act(async () => {
			// End
			await user.click(screen.getByTestId('end'))
		})
		expect(screen.getByTestId('status')).toHaveTextContent('ended')
	})

	it('throws error when useSession is used outside provider', () => {
		// Mock console.error to prevent test output pollution
		const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

		expect(() => {
			render(<TestComponent />)
		}).toThrow('useSession must be used within a SessionProvider')

		consoleSpy.mockRestore()
	})
})
