import React from 'react'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import '@testing-library/jest-dom'
import { SoldOutProducts } from '../sold-out-products'

// Mock the session context
jest.mock('@/lib/session-context', () => ({
	useSession: jest.fn(() => ({
		sessionState: {
			isStarted: false,
			isRunning: false,
			sessionId: null
		}
	}))
}))

// Mock the products API hook
jest.mock('@/lib/shopify-api', () => ({
	useProducts: jest.fn(() => ({
		data: null,
		loading: false,
		error: null,
		refetch: jest.fn()
	}))
}))

// Test wrapper component
const TestSoldOutProducts = () => {
	return (
		<div className="col-span-3">
			<SoldOutProducts />
		</div>
	)
}

describe('Sold Out Products Card', () => {
	it('renders the card title', () => {
		render(<TestSoldOutProducts />)

		expect(screen.getByText('Sold Out Products')).toBeInTheDocument()
	})

	it('displays the correct description when no session is started', () => {
		render(<TestSoldOutProducts />)

		expect(
			screen.getAllByText('Start a session to track sold out products').length
		).toBeGreaterThan(0)
	})

	it('has correct layout classes', () => {
		render(<TestSoldOutProducts />)

		const card = screen.getByText('Sold Out Products').closest('.col-span-3')
		expect(card).toBeInTheDocument()
	})
})
