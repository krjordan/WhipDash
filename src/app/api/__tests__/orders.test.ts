import { GET } from '../orders/route'
import { NextRequest, NextResponse } from 'next/server'
import { shopify, createShopifySession } from '@/lib/shopify'

// Mock NextRequest and NextResponse
jest.mock('next/server', () => ({
	NextRequest: jest.fn(),
	NextResponse: {
		json: jest.fn()
	}
}))

// Mock the Shopify library
jest.mock('@/lib/shopify', () => ({
	shopify: {
		clients: {
			Rest: jest.fn()
		}
	},
	createShopifySession: jest.fn()
}))

const mockShopifyClient = {
	get: jest.fn()
}

const mockSession = {
	id: '1',
	shop: 'test-shop.myshopify.com',
	accessToken: 'test-token',
	state: '',
	isOnline: false
}

const mockOrdersResponse = {
	body: {
		orders: [
			{
				id: '12345',
				name: '#1001',
				created_at: '2024-01-15T10:00:00Z',
				subtotal_price: '100.00',
				total_tax: '10.00',
				total_shipping_price_set: {
					shop_money: {
						amount: '5.00'
					}
				},
				total_price: '115.00',
				current_subtotal_price: '95.00',
				total_discounts: '5.00',
				financial_status: 'paid',
				fulfillment_status: 'unfulfilled'
			},
			{
				id: '12346',
				name: '#1002',
				created_at: '2024-01-15T11:00:00Z',
				subtotal_price: '200.00',
				total_tax: '20.00',
				total_shipping_price_set: {
					shop_money: {
						amount: '10.00'
					}
				},
				total_price: '230.00',
				current_subtotal_price: '190.00',
				total_discounts: '10.00',
				financial_status: 'paid',
				fulfillment_status: 'unfulfilled'
			}
		]
	}
}

describe('/api/orders', () => {
	beforeEach(() => {
		jest.clearAllMocks()

		// Setup mocks
		;(createShopifySession as jest.Mock).mockReturnValue(mockSession)
		;(shopify.clients.Rest as unknown as jest.Mock).mockReturnValue(
			mockShopifyClient
		)
		mockShopifyClient.get.mockResolvedValue(mockOrdersResponse)
		;(NextResponse.json as jest.Mock).mockImplementation((data, options) => ({
			json: () => Promise.resolve(data),
			status: options?.status || 200,
			...options
		}))
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('fetches orders with default parameters', async () => {
		const mockRequest = {
			url: 'http://localhost:3000/api/orders'
		} as NextRequest

		await GET(mockRequest)

		expect(createShopifySession).toHaveBeenCalled()
		expect(shopify.clients.Rest).toHaveBeenCalledWith({ session: mockSession })
		expect(mockShopifyClient.get).toHaveBeenCalledWith({
			path: 'orders',
			query: {
				status: 'open',
				fulfillment_status: 'unfulfilled',
				limit: 250
			}
		})
		expect(NextResponse.json).toHaveBeenCalledWith(mockOrdersResponse)
	})

	it('filters orders for today when today=true', async () => {
		const mockRequest = {
			url: 'http://localhost:3000/api/orders?today=true'
		} as NextRequest

		await GET(mockRequest)

		const callArgs = mockShopifyClient.get.mock.calls[0][0]
		expect(callArgs.query.status).toBe('open')
		expect(callArgs.query.fulfillment_status).toBe('unfulfilled')
		expect(callArgs.query.limit).toBe(250)
		expect(callArgs.query.created_at_min).toMatch(
			/^\d{4}-\d{2}-\d{2}T\d{2}:00:00\.\d{3}Z$/
		)
	})

	it('applies custom date range filters', async () => {
		const mockRequest = {
			url: 'http://localhost:3000/api/orders?created_at_min=2024-01-01&created_at_max=2024-01-31'
		} as NextRequest

		await GET(mockRequest)

		const callArgs = mockShopifyClient.get.mock.calls[0][0]
		expect(callArgs.query).toEqual({
			status: 'open',
			fulfillment_status: 'unfulfilled',
			limit: 250,
			created_at_min: '2024-01-01',
			created_at_max: '2024-01-31'
		})
	})

	it('handles only created_at_min parameter', async () => {
		const mockRequest = {
			url: 'http://localhost:3000/api/orders?created_at_min=2024-01-01'
		} as NextRequest

		await GET(mockRequest)

		const callArgs = mockShopifyClient.get.mock.calls[0][0]
		expect(callArgs.query).toEqual({
			status: 'open',
			fulfillment_status: 'unfulfilled',
			limit: 250,
			created_at_min: '2024-01-01'
		})
	})

	it('handles only created_at_max parameter', async () => {
		const mockRequest = {
			url: 'http://localhost:3000/api/orders?created_at_max=2024-01-31'
		} as NextRequest

		await GET(mockRequest)

		const callArgs = mockShopifyClient.get.mock.calls[0][0]
		expect(callArgs.query).toEqual({
			status: 'open',
			fulfillment_status: 'unfulfilled',
			limit: 250,
			created_at_max: '2024-01-31'
		})
	})

	it('handles Shopify API errors gracefully', async () => {
		const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
		const mockError = new Error('Shopify API Error')
		mockShopifyClient.get.mockRejectedValue(mockError)

		const mockRequest = {
			url: 'http://localhost:3000/api/orders'
		} as NextRequest

		await GET(mockRequest)

		expect(NextResponse.json).toHaveBeenCalledWith(
			{ error: 'Failed to fetch orders' },
			{ status: 500 }
		)
		expect(consoleSpy).toHaveBeenCalledWith('Error fetching orders:', mockError)

		consoleSpy.mockRestore()
	})

	it('handles session creation errors', async () => {
		const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
		const mockError = new Error('Session creation failed')
		;(createShopifySession as jest.Mock).mockImplementation(() => {
			throw mockError
		})

		const mockRequest = {
			url: 'http://localhost:3000/api/orders'
		} as NextRequest

		await GET(mockRequest)

		expect(NextResponse.json).toHaveBeenCalledWith(
			{ error: 'Failed to fetch orders' },
			{ status: 500 }
		)
		expect(consoleSpy).toHaveBeenCalledWith('Error fetching orders:', mockError)

		consoleSpy.mockRestore()
	})

	it('filters out undefined query parameters', async () => {
		const mockRequest = {
			url: 'http://localhost:3000/api/orders'
		} as NextRequest

		await GET(mockRequest)

		const callArgs = mockShopifyClient.get.mock.calls[0][0]
		const queryKeys = Object.keys(callArgs.query)

		// Should only contain defined parameters
		expect(queryKeys).toEqual(['status', 'fulfillment_status', 'limit'])
		expect(callArgs.query.created_at_min).toBeUndefined()
		expect(callArgs.query.created_at_max).toBeUndefined()
	})
})
