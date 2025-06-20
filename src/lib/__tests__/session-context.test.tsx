import React from 'react'
import { render, act } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import toast from 'react-hot-toast'
import { SessionProvider, useSession } from '../session-context'

// Test component that uses the session context
const TestComponent = () => {
	const {
		sessionState,
		salesGoalState,
		ordersState,
		startSession,
		pauseSession,
		resumeSession,
		endSession,
		setSalesGoal,
		addSale,
		resetSales,
		addOrder,
		resetOrders,
		showSessionModal,
		openSessionModal,
		closeSessionModal
	} = useSession()

	return (
		<div>
			<div data-testid="status">{sessionState.status}</div>
			<div data-testid="isStarted">{sessionState.isStarted.toString()}</div>
			<div data-testid="isRunning">{sessionState.isRunning.toString()}</div>
			<div data-testid="isEnded">{sessionState.isEnded.toString()}</div>
			<div data-testid="duration">{sessionState.duration}</div>
			<div data-testid="showSessionModal">{showSessionModal.toString()}</div>

			{/* Sales goal state */}
			<div data-testid="goalAmount">{salesGoalState.goalAmount}</div>
			<div data-testid="currentAmount">{salesGoalState.currentAmount}</div>

			{/* Orders state */}
			<div data-testid="totalOrders">{ordersState.totalOrders}</div>
			<div data-testid="lastSessionOrders">{ordersState.lastSessionOrders}</div>

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

			{/* Orders buttons */}
			<button
				onClick={() => addOrder()}
				data-testid="addOrder"
			>
				Add Order
			</button>
			<button
				onClick={resetOrders}
				data-testid="resetOrders"
			>
				Reset Orders
			</button>

			{/* Modal buttons */}
			<button
				onClick={openSessionModal}
				data-testid="openModal"
			>
				Open Modal
			</button>
			<button
				onClick={closeSessionModal}
				data-testid="closeModal"
			>
				Close Modal
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

		// Orders initial state
		expect(screen.getByTestId('totalOrders')).toHaveTextContent('0')
		expect(screen.getByTestId('lastSessionOrders')).toHaveTextContent('0')
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

	describe('Orders Functionality', () => {
		it('handles addOrder correctly', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			await act(async () => {
				await user.click(screen.getByTestId('addOrder'))
			})

			expect(screen.getByTestId('totalOrders')).toHaveTextContent('1')
			expect(screen.getByTestId('lastSessionOrders')).toHaveTextContent('0') // Should remain unchanged

			// Add another order
			await act(async () => {
				await user.click(screen.getByTestId('addOrder'))
			})

			expect(screen.getByTestId('totalOrders')).toHaveTextContent('2')
		})

		it('handles resetOrders correctly', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			// Add some orders first
			await act(async () => {
				await user.click(screen.getByTestId('addOrder'))
				await user.click(screen.getByTestId('addOrder'))
			})

			expect(screen.getByTestId('totalOrders')).toHaveTextContent('2')

			// Reset orders
			await act(async () => {
				await user.click(screen.getByTestId('resetOrders'))
			})

			expect(screen.getByTestId('totalOrders')).toHaveTextContent('0')
			expect(screen.getByTestId('lastSessionOrders')).toHaveTextContent('0') // Should remain unchanged
		})

		it('stores current orders as last session data when ending session', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			// Add some orders during a session
			await act(async () => {
				await user.click(screen.getByTestId('start'))
				await user.click(screen.getByTestId('addOrder'))
				await user.click(screen.getByTestId('addOrder'))
				await user.click(screen.getByTestId('addOrder'))
			})

			expect(screen.getByTestId('totalOrders')).toHaveTextContent('3')
			expect(screen.getByTestId('lastSessionOrders')).toHaveTextContent('0')

			// End session
			await act(async () => {
				await user.click(screen.getByTestId('end'))
			})

			// Current orders should be preserved for display, last session should store the value
			expect(screen.getByTestId('totalOrders')).toHaveTextContent('3') // Data preserved
			expect(screen.getByTestId('lastSessionOrders')).toHaveTextContent('3')
		})

		it('handles multiple session cycles correctly', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			// First session: 2 orders
			await act(async () => {
				await user.click(screen.getByTestId('start'))
				await user.click(screen.getByTestId('addOrder'))
				await user.click(screen.getByTestId('addOrder'))
				await user.click(screen.getByTestId('end'))
			})

			// Data is preserved after ending first session
			expect(screen.getByTestId('totalOrders')).toHaveTextContent('2')
			expect(screen.getByTestId('lastSessionOrders')).toHaveTextContent('2')

			// Second session: 5 orders (start resets current data)
			await act(async () => {
				await user.click(screen.getByTestId('start'))
				await user.click(screen.getByTestId('addOrder'))
				await user.click(screen.getByTestId('addOrder'))
				await user.click(screen.getByTestId('addOrder'))
				await user.click(screen.getByTestId('addOrder'))
				await user.click(screen.getByTestId('addOrder'))
				await user.click(screen.getByTestId('end'))
			})

			// Last session should now be 5 (from second session)
			expect(screen.getByTestId('totalOrders')).toHaveTextContent('5')
			expect(screen.getByTestId('lastSessionOrders')).toHaveTextContent('5')
		})

		it('orders work independently of sales', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			await act(async () => {
				await user.click(screen.getByTestId('start'))

				// Add orders and sales in mixed order
				await user.click(screen.getByTestId('addOrder'))
				await user.click(screen.getByTestId('addSale100'))
				await user.click(screen.getByTestId('addOrder'))
				await user.click(screen.getByTestId('addSale50'))
				await user.click(screen.getByTestId('addOrder'))
			})

			// Orders and sales should be tracked independently
			expect(screen.getByTestId('totalOrders')).toHaveTextContent('3')
			expect(screen.getByTestId('currentAmount')).toHaveTextContent('150')

			// Reset only orders
			await act(async () => {
				await user.click(screen.getByTestId('resetOrders'))
			})

			expect(screen.getByTestId('totalOrders')).toHaveTextContent('0')
			expect(screen.getByTestId('currentAmount')).toHaveTextContent('150') // Sales should remain

			// Reset only sales
			await act(async () => {
				await user.click(screen.getByTestId('addOrder'))
				await user.click(screen.getByTestId('resetSales'))
			})

			expect(screen.getByTestId('totalOrders')).toHaveTextContent('1') // Orders should remain
			expect(screen.getByTestId('currentAmount')).toHaveTextContent('0')
		})
	})

	it('triggers toast notifications for session actions', async () => {
		const user = userEvent.setup()
		renderWithProvider()

		// Clear any initial mock calls
		jest.clearAllMocks()

		// Start session should trigger toast
		await act(async () => {
			await user.click(screen.getByTestId('start'))
		})

		expect(toast.success).toHaveBeenCalledWith('🚀 Sales session started!', {
			id: 'session-started',
			duration: 3000
		})

		// Clear mocks for next action
		jest.clearAllMocks()

		// Pause session should trigger toast
		await act(async () => {
			await user.click(screen.getByTestId('pause'))
		})

		expect(toast).toHaveBeenCalledWith('⏸️ Session paused', {
			id: 'session-paused',
			duration: 2000
		})

		// Clear mocks for next action
		jest.clearAllMocks()

		// Resume session should trigger toast
		await act(async () => {
			await user.click(screen.getByTestId('resume'))
		})

		expect(toast.success).toHaveBeenCalledWith('▶️ Session resumed', {
			id: 'session-resumed',
			duration: 2000
		})

		// Clear mocks for next action
		jest.clearAllMocks()

		// End session should trigger toast with stats
		await act(async () => {
			await user.click(screen.getByTestId('end'))
		})

		expect(toast.success).toHaveBeenCalledWith(
			expect.stringMatching(/🏁 Session ended! \d+ orders, \$[\d.]+ in sales/),
			{
				id: 'session-ended',
				duration: 5000
			}
		)
	})

	it('triggers toast notifications for sales goal changes', async () => {
		const user = userEvent.setup()
		renderWithProvider()

		// Clear any initial mock calls
		jest.clearAllMocks()

		// Set sales goal should trigger toast
		await act(async () => {
			await user.click(screen.getByTestId('setSalesGoal'))
		})

		expect(toast).toHaveBeenCalledWith('🎯 Sales goal set to $500.00', {
			id: 'goal-set',
			duration: 2000
		})
	})

	describe('Duration Tracking', () => {
		beforeEach(() => {
			jest.useFakeTimers()
		})

		afterEach(() => {
			jest.runOnlyPendingTimers()
			jest.useRealTimers()
		})

		it('initializes duration to 0', () => {
			renderWithProvider()
			expect(screen.getByTestId('duration')).toHaveTextContent('0')
		})

		it('tracks duration when session is running', async () => {
			const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
			renderWithProvider()

			expect(screen.getByTestId('duration')).toHaveTextContent('0')

			// Start session
			await act(async () => {
				await user.click(screen.getByTestId('start'))
			})

			expect(screen.getByTestId('duration')).toHaveTextContent('0')

			// Fast-forward time by 5 seconds
			act(() => {
				jest.advanceTimersByTime(5000)
			})

			expect(screen.getByTestId('duration')).toHaveTextContent('5')

			// Fast-forward another 3 seconds
			act(() => {
				jest.advanceTimersByTime(3000)
			})

			expect(screen.getByTestId('duration')).toHaveTextContent('8')
		}, 10000)

		it('pauses duration tracking when session is paused', async () => {
			const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
			renderWithProvider()

			// Start session and let it run
			await act(async () => {
				await user.click(screen.getByTestId('start'))
			})

			act(() => {
				jest.advanceTimersByTime(3000)
			})

			expect(screen.getByTestId('duration')).toHaveTextContent('3')

			// Pause session
			await act(async () => {
				await user.click(screen.getByTestId('pause'))
			})

			// Time passes but duration shouldn't increase
			act(() => {
				jest.advanceTimersByTime(5000)
			})

			expect(screen.getByTestId('duration')).toHaveTextContent('3')
		})

		it('resumes duration tracking when session is resumed', async () => {
			const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
			renderWithProvider()

			// Start, run, pause, resume
			await act(async () => {
				await user.click(screen.getByTestId('start'))
			})

			act(() => {
				jest.advanceTimersByTime(2000)
			})

			await act(async () => {
				await user.click(screen.getByTestId('pause'))
			})

			act(() => {
				jest.advanceTimersByTime(5000) // This time shouldn't count
			})

			await act(async () => {
				await user.click(screen.getByTestId('resume'))
			})

			// Duration should continue from where it left off
			expect(screen.getByTestId('duration')).toHaveTextContent('2')

			act(() => {
				jest.advanceTimersByTime(3000)
			})

			expect(screen.getByTestId('duration')).toHaveTextContent('5')
		})

		it('preserves duration when session ends', async () => {
			const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
			renderWithProvider()

			// Start and run session
			await act(async () => {
				await user.click(screen.getByTestId('start'))
			})

			act(() => {
				jest.advanceTimersByTime(10000)
			})

			expect(screen.getByTestId('duration')).toHaveTextContent('10')

			// End session
			await act(async () => {
				await user.click(screen.getByTestId('end'))
			})

			// Duration should be preserved
			expect(screen.getByTestId('duration')).toHaveTextContent('10')
		})

		it('resets duration when new session starts', async () => {
			const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
			renderWithProvider()

			// First session
			await act(async () => {
				await user.click(screen.getByTestId('start'))
			})

			act(() => {
				jest.advanceTimersByTime(5000)
			})

			await act(async () => {
				await user.click(screen.getByTestId('end'))
			})

			expect(screen.getByTestId('duration')).toHaveTextContent('5')

			// Start new session - duration should reset
			await act(async () => {
				await user.click(screen.getByTestId('start'))
			})

			expect(screen.getByTestId('duration')).toHaveTextContent('0')
		})
	})

	describe('Session Modal', () => {
		beforeEach(() => {
			jest.useFakeTimers()
		})

		afterEach(() => {
			jest.runOnlyPendingTimers()
			jest.useRealTimers()
		})

		it('initializes modal as closed', () => {
			renderWithProvider()
			expect(screen.getByTestId('showSessionModal')).toHaveTextContent('false')
		})

		it('opens modal when openSessionModal is called', async () => {
			const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
			renderWithProvider()

			await act(async () => {
				await user.click(screen.getByTestId('openModal'))
			})

			expect(screen.getByTestId('showSessionModal')).toHaveTextContent('true')
		})

		it('closes modal when closeSessionModal is called', async () => {
			const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
			renderWithProvider()

			// Open then close
			await act(async () => {
				await user.click(screen.getByTestId('openModal'))
			})

			expect(screen.getByTestId('showSessionModal')).toHaveTextContent('true')

			await act(async () => {
				await user.click(screen.getByTestId('closeModal'))
			})

			expect(screen.getByTestId('showSessionModal')).toHaveTextContent('false')
		})
	})
})
