import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { OrderControls } from '../order-controls'
import { SessionProvider, useSession } from '../../lib/session-context'

// Helper component to manipulate session context and display state in tests
const TestSessionControls = () => {
	const {
		sessionState,
		ordersState,
		salesGoalState,
		startSession,
		endSession
	} = useSession()

	return (
		<div>
			<div data-testid="session-started">
				{sessionState.isStarted.toString()}
			</div>
			<div data-testid="total-orders">{ordersState.totalOrders}</div>
			<div data-testid="current-sales">{salesGoalState.currentAmount}</div>

			<button
				onClick={startSession}
				data-testid="start-session"
			>
				Start Session
			</button>
			<button
				onClick={endSession}
				data-testid="end-session"
			>
				End Session
			</button>
		</div>
	)
}

// Test helper to wrap component with SessionProvider
const renderWithSessionProvider = (ui: React.ReactElement) => {
	return render(
		<SessionProvider>
			{ui}
			<TestSessionControls />
		</SessionProvider>
	)
}

describe('OrderControls Component', () => {
	it('does not render when session is not started', () => {
		renderWithSessionProvider(<OrderControls />)

		expect(screen.getByTestId('session-started')).toHaveTextContent('false')
		expect(screen.queryByText('Add Test Order')).not.toBeInTheDocument()
	})

	it('renders when session is started', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<OrderControls />)

		// Start session
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
		})

		expect(screen.getByTestId('session-started')).toHaveTextContent('true')
		expect(screen.getByText('Add Test Order')).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /add test order/i })
		).toBeInTheDocument()
	})

	it('adds order and sales when button is clicked', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<OrderControls />)

		// Start session
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
		})

		// Initial state
		expect(screen.getByTestId('total-orders')).toHaveTextContent('0')
		expect(screen.getByTestId('current-sales')).toHaveTextContent('0')

		// Click add order button
		await act(async () => {
			await user.click(screen.getByText('Add Test Order'))
		})

		// Should increment orders
		expect(screen.getByTestId('total-orders')).toHaveTextContent('1')

		// Should add random sales amount (between $10-$200)
		const salesAmount = parseInt(
			screen.getByTestId('current-sales').textContent || '0'
		)
		expect(salesAmount).toBeGreaterThanOrEqual(10)
		expect(salesAmount).toBeLessThanOrEqual(200)
	})

	it('adds multiple orders correctly', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<OrderControls />)

		// Start session
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
		})

		// Add multiple orders
		await act(async () => {
			await user.click(screen.getByText('Add Test Order'))
			await user.click(screen.getByText('Add Test Order'))
			await user.click(screen.getByText('Add Test Order'))
		})

		// Should have 3 orders
		expect(screen.getByTestId('total-orders')).toHaveTextContent('3')

		// Should have accumulated sales from 3 orders
		const salesAmount = parseInt(
			screen.getByTestId('current-sales').textContent || '0'
		)
		expect(salesAmount).toBeGreaterThanOrEqual(30) // Minimum 3 * $10
		expect(salesAmount).toBeLessThanOrEqual(600) // Maximum 3 * $200
	})

	it('hides when session is ended', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<OrderControls />)

		// Start session
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
		})

		expect(screen.getByText('Add Test Order')).toBeInTheDocument()

		// End session
		await act(async () => {
			await user.click(screen.getByTestId('end-session'))
		})

		expect(screen.getByTestId('session-started')).toHaveTextContent('false')
		expect(screen.queryByText('Add Test Order')).not.toBeInTheDocument()
	})

	it('shows again when new session is started', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<OrderControls />)

		// Start session
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
		})

		expect(screen.getByText('Add Test Order')).toBeInTheDocument()

		// End session
		await act(async () => {
			await user.click(screen.getByTestId('end-session'))
		})

		expect(screen.queryByText('Add Test Order')).not.toBeInTheDocument()

		// Start new session
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
		})

		expect(screen.getByText('Add Test Order')).toBeInTheDocument()
	})

	it('has proper accessibility attributes', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<OrderControls />)

		// Start session
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
		})

		const button = screen.getByRole('button', { name: /add test order/i })
		expect(button).toHaveAttribute('aria-describedby', 'add-order-desc')

		const description = screen.getByText(
			'Add a test order to the current session'
		)
		expect(description).toHaveAttribute('id', 'add-order-desc')
		expect(description).toHaveClass('sr-only')
	})

	it('generates different random sales amounts for each order', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<OrderControls />)

		// Start session
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
		})

		// Track sales amounts after each order
		const salesAmounts: number[] = []

		// Add multiple orders and track sales amounts
		for (let i = 0; i < 5; i++) {
			await act(async () => {
				await user.click(screen.getByText('Add Test Order'))
			})

			const currentSales = parseInt(
				screen.getByTestId('current-sales').textContent || '0'
			)
			salesAmounts.push(currentSales)
		}

		// Check that sales amounts are increasing (cumulative)
		expect(salesAmounts[0]).toBeGreaterThan(0)
		expect(salesAmounts[1]).toBeGreaterThan(salesAmounts[0])
		expect(salesAmounts[2]).toBeGreaterThan(salesAmounts[1])
		expect(salesAmounts[3]).toBeGreaterThan(salesAmounts[2])
		expect(salesAmounts[4]).toBeGreaterThan(salesAmounts[3])

		// Each increment should be within the expected range
		for (let i = 1; i < salesAmounts.length; i++) {
			const increment = salesAmounts[i] - salesAmounts[i - 1]
			expect(increment).toBeGreaterThanOrEqual(10)
			expect(increment).toBeLessThanOrEqual(200)
		}
	})

	it('includes shopping cart icon', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<OrderControls />)

		// Start session
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
		})

		const button = screen.getByText('Add Test Order')
		// The ShoppingCart icon should be present in the button
		expect(button.closest('button')).toContainHTML('h-4 w-4 mr-2')
	})
})
