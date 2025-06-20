import React from 'react'
import { render, act } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { LiveDuration } from '../live-duration'
import { LiveStatusBadge } from '../live-status-badge'
import { SalesGoal } from '../sales-goal'
import { TotalOrders } from '../total-orders'
import { SessionProvider, useSession } from '../../lib/session-context'

// Mock the ConfettiCelebration component for integration tests
jest.mock('../confetti-celebration', () => ({
	ConfettiCelebration: ({ isActive }: { isActive: boolean }) => {
		return isActive ? <div data-testid="confetti">Confetti Active!</div> : null
	}
}))

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

// Extended integration test component with sales goal and orders (rendered inline in tests)

// Helper component to manipulate sales and orders in tests
const SalesAndOrdersTestControls = () => {
	const { addSale, addOrder } = useSession()

	return (
		<div>
			<button
				onClick={() => addSale(100)}
				data-testid="add-sale-100"
			>
				Add $100
			</button>
			<button
				onClick={() => addSale(200)}
				data-testid="add-sale-200"
			>
				Add $200
			</button>
			<button
				onClick={() => addSale(300)}
				data-testid="add-sale-300"
			>
				Add $300
			</button>
			<button
				onClick={() => addOrder()}
				data-testid="add-order"
			>
				Add Order
			</button>
		</div>
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
		// Clear localStorage to ensure clean state between tests
		window.localStorage.clear()
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

describe('LiveDuration, LiveStatusBadge, SalesGoal, and TotalOrders Integration', () => {
	beforeEach(() => {
		jest.useFakeTimers()
		// Clear localStorage to ensure clean state between tests
		window.localStorage.clear()
	})

	afterEach(() => {
		jest.runOnlyPendingTimers()
		jest.useRealTimers()
	})

	// Helper function to start a session with sales goal
	const startSessionWithSalesGoal = async (
		user: ReturnType<typeof userEvent.setup>,
		salesGoal?: number
	) => {
		// Open modal
		const startButton = screen.getByText('Start Session')
		await user.click(startButton)

		// Optionally change sales goal
		if (salesGoal) {
			const salesGoalInput = screen.getByLabelText('Sales Goal ($)')
			await user.clear(salesGoalInput)
			await user.type(salesGoalInput, salesGoal.toString())
		}

		// Start session from modal
		const modalStartButtons = screen.getAllByText('Start Session')
		const modalStartButton = modalStartButtons[1]
		await user.click(modalStartButton)
	}

	const renderFullIntegration = () => {
		return render(
			<SessionProvider>
				<div>
					<LiveStatusBadge />
					<LiveDuration />
					<SalesGoal />
					<TotalOrders />
					<SalesAndOrdersTestControls />
				</div>
			</SessionProvider>
		)
	}

	it('sales goal component updates from live duration modal', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderFullIntegration()

		// Start session with custom sales goal
		await startSessionWithSalesGoal(user, 500)

		// Both components should show the session is active
		const headerBadge = screen.getByRole('status')
		expect(headerBadge).toHaveTextContent('Live') // Header badge
		expect(screen.getByText('Goal: $500.00')).toBeInTheDocument() // SalesGoal
		expect(screen.getByText('Tracking Sales')).toBeInTheDocument() // SalesGoal
	})

	it('sales progress works independently of duration progress', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderFullIntegration()

		// Start session with default goals
		await startSessionWithSalesGoal(user)

		// Add sales to reach sales goal (default $250)
		await act(async () => {
			await user.click(screen.getByTestId('add-sale-200'))
			await user.click(screen.getByTestId('add-sale-100'))
		})

		// Sales goal should be achieved (confetti)
		expect(screen.getByTestId('confetti')).toBeInTheDocument()
		expect(screen.getByText('Goal Achieved!')).toBeInTheDocument()

		// But duration should still be running normally
		const liveStatusElements = screen.getAllByText('Live')
		expect(liveStatusElements.length).toBeGreaterThan(0) // Should have Live status
		expect(
			screen.getByText('0% of goal (120 min remaining)')
		).toBeInTheDocument()
	})

	it('both components reset when session ends', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderFullIntegration()

		// Start session and add some progress
		await startSessionWithSalesGoal(user)

		await act(async () => {
			await user.click(screen.getByTestId('add-sale-100'))
			jest.advanceTimersByTime(60000) // 1 minute
		})

		// Both should show progress
		expect(screen.getByText('$100.00')).toBeInTheDocument() // Sales
		expect(screen.getByText('1:00')).toBeInTheDocument() // Duration

		// End session
		const endButton = screen.getByLabelText('End session')
		await user.click(endButton)

		// Both should show last session data (not reset to zero)
		expect(screen.getByText('$100.00')).toBeInTheDocument() // Sales preserved
		expect(screen.getByText('1:00')).toBeInTheDocument() // Duration preserved
		expect(screen.getByText('Ready to Start')).toBeInTheDocument() // Duration status
		expect(screen.getByText('Waiting for Session')).toBeInTheDocument() // Sales status
	})

	it('header badge reflects session state for all components', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderFullIntegration()

		const headerBadge = screen.getByRole('status')

		// Start session
		await startSessionWithSalesGoal(user)
		expect(headerBadge).toHaveTextContent('Live')

		// Pause duration (should affect header and sales status)
		const pauseButton = screen.getByLabelText('Pause timer')
		await user.click(pauseButton)

		expect(headerBadge).toHaveTextContent('Paused')
		expect(screen.getByText('Session Paused')).toBeInTheDocument() // Sales status should update

		// Resume
		const resumeButton = screen.getByLabelText('Resume timer')
		await user.click(resumeButton)

		expect(headerBadge).toHaveTextContent('Live')
		expect(screen.getByText('Tracking Sales')).toBeInTheDocument() // Sales status should update
	})

	it('confetti triggers only during active sessions', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderFullIntegration()

		// Add sales without starting session
		await act(async () => {
			await user.click(screen.getByTestId('add-sale-300'))
		})

		// No confetti should appear
		expect(screen.queryByTestId('confetti')).not.toBeInTheDocument()

		// Start session - this resets sales to 0 (as designed)
		await startSessionWithSalesGoal(user)

		// Now add sales during the active session to trigger confetti
		await act(async () => {
			await user.click(screen.getByTestId('add-sale-300'))
		})

		// Should trigger confetti now that session is active and goal reached
		expect(screen.getByTestId('confetti')).toBeInTheDocument()
		expect(screen.getByText('Goal Achieved!')).toBeInTheDocument()
	})

	it('handles multiple session cycles correctly', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderFullIntegration()

		// First session
		await startSessionWithSalesGoal(user, 200)

		await act(async () => {
			await user.click(screen.getByTestId('add-sale-200'))
		})

		expect(screen.getByTestId('confetti')).toBeInTheDocument()

		// End session
		const endButton = screen.getByLabelText('End session')
		await user.click(endButton)

		expect(screen.getByText('$200.00')).toBeInTheDocument() // Preserved from session
		expect(screen.queryByTestId('confetti')).not.toBeInTheDocument()

		// Second session with different goal
		await startSessionWithSalesGoal(user, 400)

		expect(screen.getByText('Goal: $400.00')).toBeInTheDocument()

		await act(async () => {
			await user.click(screen.getByTestId('add-sale-300'))
		})

		// Should not trigger confetti yet (only $300 of $400)
		expect(screen.queryByTestId('confetti')).not.toBeInTheDocument()

		await act(async () => {
			await user.click(screen.getByTestId('add-sale-100'))
		})

		// Now should trigger confetti
		expect(screen.getByTestId('confetti')).toBeInTheDocument()
	})

	it('sales goal changes persist across session states', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderFullIntegration()

		// Set custom goal and start session
		await startSessionWithSalesGoal(user, 600)

		// Pause session
		const pauseButton = screen.getByLabelText('Pause timer')
		await user.click(pauseButton)

		// Goal should still be $600
		expect(screen.getByText('Goal: $600.00')).toBeInTheDocument()

		// Resume session
		const resumeButton = screen.getByLabelText('Resume timer')
		await user.click(resumeButton)

		// Goal should still be $600
		expect(screen.getByText('Goal: $600.00')).toBeInTheDocument()
	})

	it('orders tracking works independently of sales and duration', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderFullIntegration()

		// Start session
		await startSessionWithSalesGoal(user)

		// Add orders independently
		await act(async () => {
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
		})

		// TotalOrders should show 3 orders
		expect(screen.getByText('Total Orders')).toBeInTheDocument()
		expect(screen.getByText('3')).toBeInTheDocument()
		expect(screen.getByText('New orders this session')).toBeInTheDocument()

		// Sales should still be at initial state
		expect(screen.getByText('$0.00')).toBeInTheDocument()

		// Duration should still be running
		expect(screen.getByText('0:00')).toBeInTheDocument()
	})

	it('orders show trending data from last session', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderFullIntegration()

		// First session: 2 orders
		await startSessionWithSalesGoal(user)
		await act(async () => {
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
		})

		// End first session
		const endButton = screen.getByLabelText('End session')
		await user.click(endButton)

		// Start second session: 3 orders
		await startSessionWithSalesGoal(user)
		await act(async () => {
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
		})

		// Should show positive trending (50% increase from 2 to 3)
		expect(screen.getByText('3')).toBeInTheDocument()
		expect(screen.getByText('+50% from last session')).toBeInTheDocument()
		expect(screen.getByText('Last session: 2 orders')).toBeInTheDocument()
	})

	it('all components reset properly including orders when session ends', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderFullIntegration()

		// Start session and add progress to all components
		await startSessionWithSalesGoal(user)

		await act(async () => {
			// Add sales
			await user.click(screen.getByTestId('add-sale-100'))
			// Add orders
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			// Let time pass
			jest.advanceTimersByTime(60000) // 1 minute
		})

		// All should show progress
		expect(screen.getByText('$100.00')).toBeInTheDocument() // Sales
		expect(screen.getByText('2')).toBeInTheDocument() // Orders
		expect(screen.getByText('1:00')).toBeInTheDocument() // Duration

		// End session
		const endButton = screen.getByLabelText('End session')
		await user.click(endButton)

		// All should show last session data (preserved, not reset)
		expect(screen.getByText('$100.00')).toBeInTheDocument() // Sales preserved
		expect(screen.getByText('2')).toBeInTheDocument() // Orders preserved
		expect(screen.getByText('1:00')).toBeInTheDocument() // Duration preserved
		expect(screen.getByText('Ready to Start')).toBeInTheDocument() // Duration status
		expect(screen.getByText('Waiting for Session')).toBeInTheDocument() // Sales status
		expect(screen.getByText('Same as last session')).toBeInTheDocument() // Orders preserved from last session
	})

	it('orders and sales work together but track independently', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderFullIntegration()

		// Start session
		await startSessionWithSalesGoal(user)

		// Add mixed orders and sales
		await act(async () => {
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-sale-100'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-sale-100'))
			await user.click(screen.getByTestId('add-order'))
		})

		// Orders should show 3
		expect(screen.getByText('3')).toBeInTheDocument()
		expect(screen.getByText('New orders this session')).toBeInTheDocument()

		// Sales should show $200
		expect(screen.getByText('$200.00')).toBeInTheDocument()
		expect(
			screen.getByText('80% of goal ($50.00 remaining)')
		).toBeInTheDocument()

		// Both components should be active independently
		expect(screen.getByText('Tracking Sales')).toBeInTheDocument()
		expect(screen.getByText('Total Orders')).toBeInTheDocument()
	})

	it('multiple session cycles preserve order trending correctly', async () => {
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
		renderFullIntegration()

		// Session 1: 1 order
		await startSessionWithSalesGoal(user)
		await act(async () => {
			await user.click(screen.getByTestId('add-order'))
		})
		const endButton1 = screen.getByLabelText('End session')
		await user.click(endButton1)

		// Session 2: 3 orders (200% increase)
		await startSessionWithSalesGoal(user)
		await act(async () => {
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
		})

		expect(screen.getByText('+200% from last session')).toBeInTheDocument()
		expect(screen.getByText('Last session: 1 orders')).toBeInTheDocument()

		const endButton2 = screen.getByLabelText('End session')
		await user.click(endButton2)

		// Session 3: 2 orders (33% decrease from 3)
		await startSessionWithSalesGoal(user)
		await act(async () => {
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
		})

		expect(screen.getByText('-33% from last session')).toBeInTheDocument()
		expect(screen.getByText('Last session: 3 orders')).toBeInTheDocument()
	})
})
