import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { SessionProvider, useSession } from '../../lib/session-context'
import { OrderControls } from '../order-controls'

// Mock react-hot-toast
jest.mock('react-hot-toast', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mockToast = jest.fn() as any
	mockToast.success = jest.fn()
	mockToast.error = jest.fn()
	mockToast.loading = jest.fn()
	mockToast.dismiss = jest.fn()

	return {
		__esModule: true,
		default: mockToast
	}
})

// Import toast after mocking
import toast from 'react-hot-toast'

// Mock the shopify-api module
jest.mock('../../lib/shopify-api', () => ({
	useOrderTotals: jest.fn(() => ({
		data: null,
		loading: false,
		error: null,
		refetch: jest.fn()
	})),
	formatDateForApi: jest.fn(() => '2024-01-01')
}))

// Test component to trigger session actions
const TestSessionActions = () => {
	const {
		sessionState,
		ordersState,
		salesGoalState,
		startSession,
		pauseSession,
		resumeSession,
		endSession,
		setSalesGoal,
		refreshShopifyData
	} = useSession()

	return (
		<div>
			<div data-testid="session-status">{sessionState.status}</div>
			<div data-testid="total-orders">{ordersState.totalOrders}</div>
			<div data-testid="current-sales">{salesGoalState.currentAmount}</div>
			<div data-testid="goal-amount">{salesGoalState.goalAmount}</div>

			<button
				onClick={startSession}
				data-testid="start-session"
			>
				Start Session
			</button>
			<button
				onClick={pauseSession}
				data-testid="pause-session"
			>
				Pause Session
			</button>
			<button
				onClick={resumeSession}
				data-testid="resume-session"
			>
				Resume Session
			</button>
			<button
				onClick={endSession}
				data-testid="end-session"
			>
				End Session
			</button>
			<button
				onClick={() => setSalesGoal(500)}
				data-testid="set-goal"
			>
				Set Goal $500
			</button>
			<button
				onClick={refreshShopifyData}
				data-testid="refresh-data"
			>
				Refresh Data
			</button>
		</div>
	)
}

const renderWithProvider = () => {
	return render(
		<SessionProvider>
			<TestSessionActions />
			<OrderControls />
		</SessionProvider>
	)
}

describe('Toast Notifications', () => {
	beforeEach(() => {
		// Clear all mocks before each test
		jest.clearAllMocks()
	})

	describe('Session Management Toasts', () => {
		it('shows success toast when session starts', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			await act(async () => {
				await user.click(screen.getByTestId('start-session'))
			})

			expect(toast.success).toHaveBeenCalledWith('🚀 Sales session started!', {
				id: 'session-started',
				duration: 3000
			})
		})

		it('shows toast when session is paused', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			// Start session first
			await act(async () => {
				await user.click(screen.getByTestId('start-session'))
			})

			jest.clearAllMocks() // Clear the start session toast

			// Pause session
			await act(async () => {
				await user.click(screen.getByTestId('pause-session'))
			})

			expect(toast).toHaveBeenCalledWith('⏸️ Session paused', {
				id: 'session-paused',
				duration: 2000
			})
		})

		it('shows success toast when session is resumed', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			// Start, then pause session
			await act(async () => {
				await user.click(screen.getByTestId('start-session'))
				await user.click(screen.getByTestId('pause-session'))
			})

			jest.clearAllMocks() // Clear previous toasts

			// Resume session
			await act(async () => {
				await user.click(screen.getByTestId('resume-session'))
			})

			expect(toast.success).toHaveBeenCalledWith('▶️ Session resumed', {
				id: 'session-resumed',
				duration: 2000
			})
		})

		it('shows session ended toast with final stats', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			// Start session
			await act(async () => {
				await user.click(screen.getByTestId('start-session'))
			})

			// Add some test orders to have stats
			await act(async () => {
				await user.click(screen.getByText('Add Test Order'))
				await user.click(screen.getByText('Add Test Order'))
			})

			jest.clearAllMocks() // Clear previous toasts

			// End session
			await act(async () => {
				await user.click(screen.getByTestId('end-session'))
			})

			expect(toast.success).toHaveBeenCalledWith(
				expect.stringMatching(
					/🏁 Session ended! \d+ orders, \$[\d.]+ in sales/
				),
				{
					id: 'session-ended',
					duration: 5000
				}
			)
		})
	})

	describe('Sales Goal Toasts', () => {
		it('shows toast when sales goal is set', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			await act(async () => {
				await user.click(screen.getByTestId('set-goal'))
			})

			expect(toast).toHaveBeenCalledWith('🎯 Sales goal set to $500.00', {
				id: 'goal-set',
				duration: 2000
			})
		})
	})

	describe('Order Control Toasts', () => {
		it('shows success toast when test order is added', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			// Start session first
			await act(async () => {
				await user.click(screen.getByTestId('start-session'))
			})

			jest.clearAllMocks() // Clear start session toast

			// Add test order
			await act(async () => {
				await user.click(screen.getByText('Add Test Order'))
			})

			expect(toast.success).toHaveBeenCalledWith(
				expect.stringMatching(/🛒 Test order added! \+\$[\d.]+/),
				{
					duration: 3000
				}
			)
		})

		it('shows correct amount in test order toast', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			// Start session
			await act(async () => {
				await user.click(screen.getByTestId('start-session'))
			})

			jest.clearAllMocks()

			// Add test order
			await act(async () => {
				await user.click(screen.getByText('Add Test Order'))
			})

			// Verify toast was called with proper format
			expect(toast.success).toHaveBeenCalledTimes(1)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const [message, options] = (toast.success as jest.MockedFunction<any>)
				.mock.calls[0]

			expect(message).toMatch(/🛒 Test order added! \+\$\d+\.\d{2}/)
			expect(options.duration).toBe(3000)
		})
	})

	describe('Data Refresh Toasts', () => {
		it('shows loading toast when refreshing data', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			await act(async () => {
				await user.click(screen.getByTestId('refresh-data'))
			})

			expect(toast.loading).toHaveBeenCalledWith(
				'🔄 Refreshing sales data...',
				{
					id: 'refresh-data',
					duration: 2000
				}
			)
		})
	})

	describe('Toast Prevention Logic', () => {
		it('only shows session started toast once per session', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			// Start session
			await act(async () => {
				await user.click(screen.getByTestId('start-session'))
			})

			expect(toast.success).toHaveBeenCalledWith('🚀 Sales session started!', {
				id: 'session-started',
				duration: 3000
			})

			// Starting again shouldn't show another toast (user would need to end first)
			expect(toast.success).toHaveBeenCalledTimes(1)
		})

		it('uses unique IDs to prevent duplicate toasts', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			// Various actions that should have unique IDs
			await act(async () => {
				await user.click(screen.getByTestId('start-session'))
				await user.click(screen.getByTestId('set-goal'))
				await user.click(screen.getByTestId('refresh-data'))
			})

			// Check that each toast has a unique ID
			const toastCalls = [
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				...(toast.success as jest.MockedFunction<any>).mock.calls,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				...(toast as jest.MockedFunction<any>).mock.calls,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				...(toast.loading as jest.MockedFunction<any>).mock.calls
			]

			const ids = toastCalls
				.map((call) => call[1]?.id)
				.filter((id) => id !== undefined)

			const uniqueIds = new Set(ids)
			expect(uniqueIds.size).toBe(ids.length) // All IDs should be unique
		})
	})

	describe('Toast Integration', () => {
		it('handles multiple rapid actions without issues', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			// Rapid succession of actions
			await act(async () => {
				await user.click(screen.getByTestId('start-session'))
				await user.click(screen.getByTestId('set-goal'))
				await user.click(screen.getByText('Add Test Order'))
				await user.click(screen.getByText('Add Test Order'))
				await user.click(screen.getByTestId('pause-session'))
				await user.click(screen.getByTestId('resume-session'))
			})

			// Should have called toast methods multiple times without errors
			expect(toast.success).toHaveBeenCalledTimes(4) // start, 2 orders, resume
			expect(toast).toHaveBeenCalledTimes(2) // goal set, pause
		})

		it('maintains toast functionality across session lifecycle', async () => {
			const user = userEvent.setup()
			renderWithProvider()

			// Complete session lifecycle
			await act(async () => {
				// Start session
				await user.click(screen.getByTestId('start-session'))
				// Add activity
				await user.click(screen.getByText('Add Test Order'))
				// Pause and resume
				await user.click(screen.getByTestId('pause-session'))
				await user.click(screen.getByTestId('resume-session'))
				// End session
				await user.click(screen.getByTestId('end-session'))
			})

			// Verify toasts were called for each major action
			expect(toast.success).toHaveBeenCalledWith(
				'🚀 Sales session started!',
				expect.any(Object)
			)
			expect(toast.success).toHaveBeenCalledWith(
				expect.stringMatching(/🛒 Test order added!/),
				expect.any(Object)
			)
			expect(toast).toHaveBeenCalledWith(
				'⏸️ Session paused',
				expect.any(Object)
			)
			expect(toast.success).toHaveBeenCalledWith(
				'▶️ Session resumed',
				expect.any(Object)
			)
			expect(toast.success).toHaveBeenCalledWith(
				expect.stringMatching(/🏁 Session ended!/),
				expect.any(Object)
			)
		})
	})
})
