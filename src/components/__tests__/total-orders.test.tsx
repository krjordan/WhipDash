import React from 'react'
import { render, act } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { TotalOrders } from '../total-orders'
import { SessionProvider, useSession } from '../../lib/session-context'

// Helper component to manipulate session context in tests
const TestSessionControls = () => {
	const { startSession, endSession, addOrder } = useSession()

	return (
		<div>
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
			<button
				onClick={() => addOrder()}
				data-testid="add-order"
			>
				Add Order
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

describe('TotalOrders Component', () => {
	beforeEach(() => {
		// Clear localStorage to ensure clean state between tests
		window.localStorage.clear()

		// Mock localStorage if not already mocked
		if (!window.localStorage.getItem) {
			Object.defineProperty(window, 'localStorage', {
				value: {
					getItem: jest.fn(() => null),
					setItem: jest.fn(),
					removeItem: jest.fn(),
					clear: jest.fn()
				},
				writable: true
			})
		}
	})

	it('renders with initial state', () => {
		renderWithSessionProvider(<TotalOrders />)

		expect(screen.getByText('Total Orders')).toBeInTheDocument()
		expect(screen.getByText('0')).toBeInTheDocument()
		expect(screen.getByText('No data from last session')).toBeInTheDocument()

		// ShoppingCart icon should be present
		expect(
			screen.getByText('Total Orders').closest('[data-slot="card-header"]')
		).toBeInTheDocument()
	})

	it('shows current orders count when orders are added', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<TotalOrders />)

		// Add some orders
		await act(async () => {
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
		})

		expect(screen.getByText('3')).toBeInTheDocument()
		expect(screen.getByText('New orders this session')).toBeInTheDocument()
	})

	it('shows last session data when session is active', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<TotalOrders />)

		// First, add orders and end session to create "last session" data
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('end-session'))
		})

		// Start new session
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
		})

		expect(screen.getByText('Last session: 2 orders')).toBeInTheDocument()
	})

	it('calculates trending percentage correctly - positive trend', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<TotalOrders />)

		// First session: 2 orders
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('end-session'))
		})

		// Second session: 3 orders (50% increase)
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
		})

		expect(screen.getByText('3')).toBeInTheDocument()
		expect(screen.getByText('+50% from last session')).toBeInTheDocument()

		// Should show trending up icon
		const trendIcon = screen.getByText('+50% from last session').parentElement
		expect(trendIcon).toContainHTML('text-green-600')
	})

	it('calculates trending percentage correctly - negative trend', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<TotalOrders />)

		// First session: 4 orders
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('end-session'))
		})

		// Second session: 2 orders (50% decrease)
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
		})

		expect(screen.getByText('2')).toBeInTheDocument()
		expect(screen.getByText('-50% from last session')).toBeInTheDocument()

		// Should show trending down icon
		const trendIcon = screen.getByText('-50% from last session').parentElement
		expect(trendIcon).toContainHTML('text-red-600')
	})

	it('handles same performance as last session', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<TotalOrders />)

		// First session: 3 orders
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('end-session'))
		})

		// Second session: 3 orders (same)
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
		})

		expect(screen.getByText('3')).toBeInTheDocument()
		expect(screen.getByText('Same as last session')).toBeInTheDocument()

		// Should not show any trending icon
		const textElement = screen.getByText('Same as last session').parentElement
		expect(textElement).not.toContainHTML('text-green-600')
		expect(textElement).not.toContainHTML('text-red-600')
	})

	it('handles first session with orders correctly', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<TotalOrders />)

		// Add orders without any previous session
		await act(async () => {
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
		})

		expect(screen.getByText('2')).toBeInTheDocument()
		expect(screen.getByText('New orders this session')).toBeInTheDocument()
	})

	it('handles zero orders in both sessions', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<TotalOrders />)

		// First session: no orders
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
			await user.click(screen.getByTestId('end-session'))
		})

		// Second session: no orders
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
		})

		expect(screen.getByText('0')).toBeInTheDocument()
		expect(screen.getByText('No data from last session')).toBeInTheDocument()
	})

	it('rounds trending percentage correctly', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<TotalOrders />)

		// First session: 3 orders
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('end-session'))
		})

		// Second session: 4 orders (33.33% increase, should round to 33%)
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
		})

		expect(screen.getByText('4')).toBeInTheDocument()
		expect(screen.getByText('+33% from last session')).toBeInTheDocument()
	})

	it('handles extremely large percentage increases', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<TotalOrders />)

		// First session: 1 order
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('end-session'))
		})

		// Second session: 10 orders (900% increase)
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
			for (let i = 0; i < 10; i++) {
				await user.click(screen.getByTestId('add-order'))
			}
		})

		expect(screen.getByText('10')).toBeInTheDocument()
		expect(screen.getByText('+900% from last session')).toBeInTheDocument()
	})

	it('does not show last session data when no session is active', async () => {
		const user = userEvent.setup()
		renderWithSessionProvider(<TotalOrders />)

		// First session: add orders and end
		await act(async () => {
			await user.click(screen.getByTestId('start-session'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('add-order'))
			await user.click(screen.getByTestId('end-session'))
		})

		// Should not show "Last session: X orders" when no session is active
		expect(screen.queryByText(/Last session:/)).not.toBeInTheDocument()
		// Should preserve current data from ended session
		expect(screen.getByText('2')).toBeInTheDocument()
		// Should show same as last session since we preserved the data
		expect(screen.getByText('Same as last session')).toBeInTheDocument()
	})
})
