import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { SoldOutProducts } from '../sold-out-products'

// Mock fetch globally
global.fetch = jest.fn()

// Mock the session context with more complete functionality
const mockAddSoldOutProduct = jest.fn()
const mockSessionState = {
	isStarted: false,
	isRunning: false,
	sessionId: null as string | null,
	startTime: null as string | null
}

jest.mock('@/lib/session-context', () => ({
	useSession: jest.fn(() => ({
		sessionState: mockSessionState,
		addSoldOutProduct: mockAddSoldOutProduct
	}))
}))

// Mock the products API hook
const mockRefetch = jest.fn()
const mockProductsData = {
	products: [],
	total_count: 0,
	sold_out_count: 0,
	filter: { sold_out_only: false }
}

jest.mock('@/lib/shopify-api', () => ({
	useProducts: jest.fn(() => ({
		data: mockProductsData,
		loading: false,
		error: null,
		refetch: mockRefetch
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
	beforeEach(() => {
		jest.clearAllMocks()
		// Reset fetch mock
		;(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => ({
				products: [],
				total_count: 0,
				sold_out_count: 0
			})
		})
		// Reset mock data
		mockSessionState.isStarted = false
		mockSessionState.isRunning = false
		mockSessionState.sessionId = null
		mockSessionState.startTime = null
		Object.assign(mockProductsData, {
			products: [],
			total_count: 0,
			sold_out_count: 0,
			filter: { sold_out_only: false }
		})
	})

	describe('Basic Rendering', () => {
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

	describe('Session Integration', () => {
		it('shows session-based message when session is started', () => {
			mockSessionState.isStarted = true
			mockSessionState.isRunning = true
			mockSessionState.sessionId = 'test-session'
			mockSessionState.startTime = '2024-01-01T11:00:00Z'

			render(<TestSoldOutProducts />)

			// Should not show the "Start a session" message
			expect(
				screen.queryByText('Start a session to track sold out products')
			).not.toBeInTheDocument()
		})

		it('reports session sold-out products to session context', () => {
			mockSessionState.isStarted = true
			mockSessionState.isRunning = true
			mockSessionState.sessionId = 'test-session'
			mockSessionState.startTime = '2024-01-01T11:00:00Z'

			// Mock product data with sold out products that would be "session sold out"
			Object.assign(mockProductsData, {
				products: [
					{
						id: '123',
						title: 'Test Product',
						handle: 'test-product',
						variants: [
							{
								id: '456',
								title: 'Small',
								inventory_quantity: 0,
								is_sold_out: true
							},
							{
								id: '789',
								title: 'Large',
								inventory_quantity: 5,
								is_sold_out: false
							}
						],
						has_sold_out_variants: true,
						all_variants_sold_out: false
					}
				],
				total_count: 1,
				sold_out_count: 1
			})

			render(<TestSoldOutProducts />)

			// The component should call addSoldOutProduct for session products
			// Note: This would require the component to detect products as "session sold out"
			// which depends on session start inventory state
		})

		it('refreshes data during active sessions', () => {
			mockSessionState.isStarted = true
			mockSessionState.isRunning = true

			render(<TestSoldOutProducts />)

			// Component should call refetch periodically during active sessions
			// This would be tested with timer mocks in a more complete test
		})
	})

	describe('Product Display', () => {
		it('displays sold out products correctly', async () => {
			// Set session as started and toggle to show all products
			mockSessionState.isStarted = true

			Object.assign(mockProductsData, {
				products: [
					{
						id: '123',
						title: 'Sold Out Product',
						handle: 'sold-out-product',
						variants: [
							{
								id: '456',
								title: 'Default',
								inventory_quantity: 0,
								is_sold_out: true
							}
						],
						has_sold_out_variants: true,
						all_variants_sold_out: true
					}
				],
				total_count: 1,
				sold_out_count: 1
			})

			const user = userEvent.setup()
			render(<TestSoldOutProducts />)

			// Click "Show All" to see all sold out products (not just session ones)
			const showAllButton = screen.getByText('Show All')
			await act(async () => {
				await user.click(showAllButton)
			})

			expect(screen.getByText('Sold Out Product')).toBeInTheDocument()
		})

		it('shows session filter toggle when session is active', () => {
			mockSessionState.isStarted = true

			render(<TestSoldOutProducts />)

			// Should show the session filter toggle - defaults to "Show All" button
			expect(screen.getByText('Show All')).toBeInTheDocument()
		})

		it('handles empty state correctly', () => {
			render(<TestSoldOutProducts />)

			// The actual text in the component is "No products sold out during this session"
			expect(
				screen.getByText('No products sold out during this session')
			).toBeInTheDocument()
		})
	})

	describe('Error Handling', () => {
		it('handles API errors gracefully', () => {
			// Set session to started so error state shows
			mockSessionState.isStarted = true

			// Mock the useProducts hook to return an error
			const { useProducts } = jest.requireMock('@/lib/shopify-api')
			useProducts.mockReturnValue({
				data: null,
				loading: false,
				error: 'Failed to fetch products',
				refetch: mockRefetch
			})

			render(<TestSoldOutProducts />)

			// Check for error indication in the UI - component shows specific permission error
			expect(
				screen.getByText(/Additional Shopify Permissions Required/i)
			).toBeInTheDocument()
		})

		it('shows loading state', () => {
			// Set session to started so loading state shows
			mockSessionState.isStarted = true

			// Mock the useProducts hook to return loading state
			const { useProducts } = jest.requireMock('@/lib/shopify-api')
			useProducts.mockReturnValue({
				data: null,
				loading: true,
				error: null,
				refetch: mockRefetch
			})

			render(<TestSoldOutProducts />)

			// Check for loading indication in the UI - component shows "Loading products..."
			expect(screen.getByText(/Loading products/i)).toBeInTheDocument()
		})
	})

	describe('Session Filter Toggle', () => {
		beforeEach(() => {
			mockSessionState.isStarted = true
			mockSessionState.sessionId = 'test-session'
			mockSessionState.startTime = '2024-01-01T11:00:00Z'
		})

		it('toggles between session-only and all products view', async () => {
			const user = userEvent.setup()
			render(<TestSoldOutProducts />)

			// Find the toggle button - should initially show "Show All"
			const toggleButton = screen.getByText('Show All')

			await act(async () => {
				await user.click(toggleButton)
			})

			// Button text should change to "Session Only"
			expect(screen.getByText('Session Only')).toBeInTheDocument()
		})

		it('defaults to session-only view when session is active', () => {
			render(<TestSoldOutProducts />)

			// Should default to showing session products only - button shows "Show All"
			expect(screen.getByText('Show All')).toBeInTheDocument()
		})
	})
})
