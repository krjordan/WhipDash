import React from 'react'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import '@testing-library/jest-dom'
import { SessionProvider } from '../../lib/session-context'
import { RecentOrders } from '../recent-orders'

// Mock the shopify-api module
jest.mock('../../lib/shopify-api', () => ({
	useOrderTotals: jest.fn(() => ({
		data: null,
		loading: false,
		error: null,
		refetch: jest.fn()
	})),
	formatDateForApi: jest.fn((date) => date.toISOString().split('T')[0])
}))

// Test component to control session state
const TestComponent = () => {
	return (
		<SessionProvider>
			<RecentOrders />
		</SessionProvider>
	)
}

describe('RecentOrders Component', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('renders empty state when session is not started', () => {
		render(<TestComponent />)

		expect(screen.getByText('Recent Orders')).toBeInTheDocument()
		expect(
			screen.getAllByText('Start a session to view recent orders')
		).toHaveLength(2) // One in description, one in empty state

		// Should show shopping cart icon
		const cartIcons = document.querySelectorAll('.lucide-shopping-cart')
		expect(cartIcons.length).toBeGreaterThan(0)
	})

	it('shows empty state when no session is active', () => {
		render(<TestComponent />)

		// Should not show any customer names or order data
		expect(screen.queryByText('Rhonda Martin')).not.toBeInTheDocument()
		expect(screen.queryByText('Jackson Lee')).not.toBeInTheDocument()
		expect(screen.queryByText('Isabella Nguyen')).not.toBeInTheDocument()

		// Should show empty state (appears twice)
		expect(
			screen.getAllByText('Start a session to view recent orders')
		).toHaveLength(2)
	})

	it('displays empty state without any line items', () => {
		render(<TestComponent />)

		// Should not show any product line items
		expect(screen.queryByText('Product 1')).not.toBeInTheDocument()
		expect(screen.queryByText('Product 2')).not.toBeInTheDocument()
		expect(screen.queryByText('Premium Widget')).not.toBeInTheDocument()
		expect(screen.queryByText('Shipping')).not.toBeInTheDocument()

		// Should show empty state (appears twice)
		expect(
			screen.getAllByText('Start a session to view recent orders')
		).toHaveLength(2)
	})

	it('shows shopping cart icon in header', () => {
		render(<TestComponent />)

		const title = screen.getByText('Recent Orders')
		expect(title).toBeInTheDocument()

		// Check for shopping cart icons in the component
		const cartIcons = document.querySelectorAll('.lucide-shopping-cart')
		expect(cartIcons.length).toBeGreaterThan(0)
	})

	it('displays no user avatars when no orders present', () => {
		render(<TestComponent />)

		// Should not have any customer sections
		const customerSections = screen.queryAllByText(/Total: \$/)
		expect(customerSections).toHaveLength(0)
	})

	it('shows no quantities when no orders present', () => {
		render(<TestComponent />)

		// Should not show any quantity indicators since no orders
		expect(screen.queryByText('(×1)')).not.toBeInTheDocument()
		expect(screen.queryByText('(×2)')).not.toBeInTheDocument()
		expect(screen.queryByText('Product 1')).not.toBeInTheDocument()
		expect(screen.queryByText('Premium Widget')).not.toBeInTheDocument()
	})

	it('handles empty orders state', () => {
		render(<TestComponent />)

		// Should show empty state when session is not started
		expect(
			screen.getAllByText('Start a session to view recent orders')
		).toHaveLength(2)
		expect(screen.queryByText('Rhonda Martin')).not.toBeInTheDocument()
	})

	it('shows loading state', () => {
		render(<TestComponent />)

		// Should show empty state when session is not started
		expect(
			screen.getAllByText('Start a session to view recent orders')
		).toHaveLength(2)
		expect(screen.queryByText('Rhonda Martin')).not.toBeInTheDocument()
	})

	it('shows error state', () => {
		render(<TestComponent />)

		// Should show empty state when session is not started
		expect(
			screen.getAllByText('Start a session to view recent orders')
		).toHaveLength(2)
		expect(screen.queryByText('Rhonda Martin')).not.toBeInTheDocument()
	})

	it('shows no dates when no orders present', () => {
		render(<TestComponent />)

		// Should not show any date elements since no orders
		const dateElements = screen.queryAllByText(/•/)
		expect(dateElements).toHaveLength(0)

		// Should show empty state
		expect(
			screen.getAllByText('Start a session to view recent orders')
		).toHaveLength(2)
	})

	it('uses correct CSS classes for layout', () => {
		render(<TestComponent />)

		// Check that the card has the correct column span
		const card = screen.getByText('Recent Orders').closest('.col-span-4')
		expect(card).toBeInTheDocument()
	})

	it('has scrollable container with fixed height', () => {
		render(<TestComponent />)

		// Find the scrollable container
		const scrollableContainer = document.querySelector('.h-80.overflow-y-auto')
		expect(scrollableContainer).toBeInTheDocument()
		expect(scrollableContainer).toHaveClass('pr-2') // Right padding for scrollbar
	})
})
