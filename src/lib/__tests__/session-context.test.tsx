import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { SessionProvider, useSession } from '../session-context'

// Test component that uses the session context
const TestComponent = () => {
	const {
		sessionState,
		salesGoalState,
		startSession,
		pauseSession,
		resumeSession,
		endSession,
		setSalesGoal,
		addSale,
		resetSales
	} = useSession()

	return (
		<div>
			<div data-testid="status">{sessionState.status}</div>
			<div data-testid="isStarted">{sessionState.isStarted.toString()}</div>
			<div data-testid="isRunning">{sessionState.isRunning.toString()}</div>
			<div data-testid="isEnded">{sessionState.isEnded.toString()}</div>

			{/* Sales goal state */}
			<div data-testid="goalAmount">{salesGoalState.goalAmount}</div>
			<div data-testid="currentAmount">{salesGoalState.currentAmount}</div>

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

			{/* Sales goal buttons */}
			<button
				onClick={() => setSalesGoal(500)}
				data-testid="setSalesGoal"
			>
				Set Goal $500
			</button>
			<button
				onClick={() => addSale(100)}
				data-testid="addSale100"
			>
				Add $100 Sale
			</button>
			<button
				onClick={() => addSale(50)}
				data-testid="addSale50"
			>
				Add $50 Sale
			</button>
			<button
				onClick={resetSales}
				data-testid="resetSales"
			>
				Reset Sales
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

		// Sales goal initial state
		expect(screen.getByTestId('goalAmount')).toHaveTextContent('250')
		expect(screen.getByTestId('currentAmount')).toHaveTextContent('0')
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

	describe('Sales Goal Functionality', () => {
		it('handles setSalesGoal correctly', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			await act(async () => {
				await user.click(screen.getByTestId('setSalesGoal'))
			})

			expect(screen.getByTestId('goalAmount')).toHaveTextContent('500')
			expect(screen.getByTestId('currentAmount')).toHaveTextContent('0') // Should remain unchanged
		})

		it('handles addSale correctly', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			// Add a $100 sale
			await act(async () => {
				await user.click(screen.getByTestId('addSale100'))
			})

			expect(screen.getByTestId('currentAmount')).toHaveTextContent('100')
			expect(screen.getByTestId('goalAmount')).toHaveTextContent('250') // Should remain unchanged

			// Add a $50 sale
			await act(async () => {
				await user.click(screen.getByTestId('addSale50'))
			})

			expect(screen.getByTestId('currentAmount')).toHaveTextContent('150')
		})

		it('handles resetSales correctly', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			// Add some sales first
			await act(async () => {
				await user.click(screen.getByTestId('addSale100'))
				await user.click(screen.getByTestId('addSale50'))
			})

			expect(screen.getByTestId('currentAmount')).toHaveTextContent('150')

			// Reset sales
			await act(async () => {
				await user.click(screen.getByTestId('resetSales'))
			})

			expect(screen.getByTestId('currentAmount')).toHaveTextContent('0')
			expect(screen.getByTestId('goalAmount')).toHaveTextContent('250') // Goal should remain unchanged
		})

		it('resets currentAmount when session ends', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			// Add some sales
			await act(async () => {
				await user.click(screen.getByTestId('addSale100'))
				await user.click(screen.getByTestId('addSale50'))
			})

			expect(screen.getByTestId('currentAmount')).toHaveTextContent('150')

			// Start and end a session
			await act(async () => {
				await user.click(screen.getByTestId('start'))
				await user.click(screen.getByTestId('end'))
			})

			expect(screen.getByTestId('currentAmount')).toHaveTextContent('0')
			expect(screen.getByTestId('goalAmount')).toHaveTextContent('250') // Goal should remain unchanged
		})

		it('accumulates sales correctly across multiple additions', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			// Add multiple sales
			await act(async () => {
				await user.click(screen.getByTestId('addSale100'))
				await user.click(screen.getByTestId('addSale100'))
				await user.click(screen.getByTestId('addSale50'))
			})

			expect(screen.getByTestId('currentAmount')).toHaveTextContent('250')
			expect(screen.getByTestId('goalAmount')).toHaveTextContent('250')
		})

		it('handles sales goal changes and sales together', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			// Set a custom goal
			await act(async () => {
				await user.click(screen.getByTestId('setSalesGoal'))
			})

			expect(screen.getByTestId('goalAmount')).toHaveTextContent('500')

			// Add sales
			await act(async () => {
				await user.click(screen.getByTestId('addSale100'))
				await user.click(screen.getByTestId('addSale100'))
				await user.click(screen.getByTestId('addSale100'))
			})

			expect(screen.getByTestId('currentAmount')).toHaveTextContent('300')
			expect(screen.getByTestId('goalAmount')).toHaveTextContent('500')

			// Change goal again - should not affect current amount
			await act(async () => {
				await user.click(screen.getByTestId('setSalesGoal'))
			})

			expect(screen.getByTestId('currentAmount')).toHaveTextContent('300')
			expect(screen.getByTestId('goalAmount')).toHaveTextContent('500')
		})
	})
})
