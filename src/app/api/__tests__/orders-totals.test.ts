import { GET } from '../orders/totals/route'
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
				current_subtotal_price: '180.00',
				total_discounts: '20.00',
				financial_status: 'paid',
				fulfillment_status: 'unfulfilled'
			}
		]
	}
}

describe('/api/orders/totals', () => {
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

	it('calculates totals correctly with default parameters', async () => {
		const mockRequest = {
			url: 'http://localhost:3000/api/orders/totals'
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

		const responseData = (NextResponse.json as jest.Mock).mock.calls[0][0]

		expect(responseData.filter.dateFilter).toBe('none')
		expect(responseData.summary).toEqual({
			orderCount: 2,
			subtotalPrice: 300, // 100 + 200
			currentSubtotalPrice: 275, // 95 + 180
			totalTax: 30, // 10 + 20
			totalShipping: 15, // 5 + 10
			totalDiscounts: 25, // 5 + 20
			finalTotalPrice: 345 // 115 + 230
		})
		expect(responseData.orders).toHaveLength(2)
		expect(responseData.explanation).toBeDefined()
	})

	it('calculates individual order breakdowns correctly', async () => {
		const mockRequest = {
			url: 'http://localhost:3000/api/orders/totals'
		} as NextRequest

		await GET(mockRequest)

		const responseData = (NextResponse.json as jest.Mock).mock.calls[0][0]

		expect(responseData.orders[0]).toEqual({
			id: '12345',
			name: '#1001',
			created_at: '2024-01-15T10:00:00Z',
			subtotal_price: 100,
			total_tax: 10,
			total_shipping: 5,
			total_price: 115,
			current_subtotal_price: 95,
			total_discounts: 5,
			financial_status: 'paid',
			fulfillment_status: 'unfulfilled'
		})

		expect(responseData.orders[1]).toEqual({
			id: '12346',
			name: '#1002',
			created_at: '2024-01-15T11:00:00Z',
			subtotal_price: 200,
			total_tax: 20,
			total_shipping: 10,
			total_price: 230,
			current_subtotal_price: 180,
			total_discounts: 20,
			financial_status: 'paid',
			fulfillment_status: 'unfulfilled'
		})
	})

	it('handles today filter correctly', async () => {
		const mockRequest = {
			url: 'http://localhost:3000/api/orders/totals?today=true'
		} as NextRequest

		await GET(mockRequest)

		const callArgs = mockShopifyClient.get.mock.calls[0][0]
		expect(callArgs.query.status).toBe('open')
		expect(callArgs.query.fulfillment_status).toBe('unfulfilled')
		expect(callArgs.query.limit).toBe(250)
		expect(callArgs.query.created_at_min).toMatch(
			/^\d{4}-\d{2}-\d{2}T\d{2}:00:00\.\d{3}Z$/
		)

		const responseData = (NextResponse.json as jest.Mock).mock.calls[0][0]
		expect(responseData.filter.dateFilter).toBe('today')
		expect(responseData.filter.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
	})

	it('handles custom date range filter correctly', async () => {
		const mockRequest = {
			url: 'http://localhost:3000/api/orders/totals?created_at_min=2024-01-01&created_at_max=2024-01-31'
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

		const responseData = (NextResponse.json as jest.Mock).mock.calls[0][0]
		expect(responseData.filter.dateFilter).toBe('custom')
		expect(responseData.filter.startDate).toBe('2024-01-01')
		expect(responseData.filter.endDate).toBe('2024-01-31')
	})

	it('handles orders with missing shipping data', async () => {
		const ordersWithMissingData = {
			body: {
				orders: [
					{
						id: '12347',
						name: '#1003',
						created_at: '2024-01-15T12:00:00Z',
						subtotal_price: '50.00',
						total_tax: '5.00',
						total_shipping_price_set: null, // Missing shipping data
						total_price: '55.00',
						current_subtotal_price: '50.00',
						total_discounts: '0.00',
						financial_status: 'paid',
						fulfillment_status: 'unfulfilled'
					}
				]
			}
		}

		mockShopifyClient.get.mockResolvedValue(ordersWithMissingData)

		const mockRequest = {
			url: 'http://localhost:3000/api/orders/totals'
		} as NextRequest

		await GET(mockRequest)

		const responseData = (NextResponse.json as jest.Mock).mock.calls[0][0]

		expect(responseData.summary.totalShipping).toBe(0)
		expect(responseData.orders[0].total_shipping).toBe(0)
	})

	it('handles empty orders response', async () => {
		const emptyOrdersResponse = {
			body: {
				orders: []
			}
		}

		mockShopifyClient.get.mockResolvedValue(emptyOrdersResponse)

		const mockRequest = {
			url: 'http://localhost:3000/api/orders/totals'
		} as NextRequest

		await GET(mockRequest)

		const responseData = (NextResponse.json as jest.Mock).mock.calls[0][0]

		expect(responseData.summary).toEqual({
			orderCount: 0,
			subtotalPrice: 0,
			currentSubtotalPrice: 0,
			totalTax: 0,
			totalShipping: 0,
			totalDiscounts: 0,
			finalTotalPrice: 0
		})
		expect(responseData.orders).toEqual([])
	})

	it('rounds monetary values to 2 decimal places', async () => {
		const ordersWithDecimals = {
			body: {
				orders: [
					{
						id: '12348',
						name: '#1004',
						created_at: '2024-01-15T13:00:00Z',
						subtotal_price: '33.333',
						total_tax: '3.3333',
						total_shipping_price_set: {
							shop_money: {
								amount: '1.1111'
							}
						},
						total_price: '37.7774',
						current_subtotal_price: '31.1111',
						total_discounts: '2.2222',
						financial_status: 'paid',
						fulfillment_status: 'unfulfilled'
					}
				]
			}
		}

		mockShopifyClient.get.mockResolvedValue(ordersWithDecimals)

		const mockRequest = {
			url: 'http://localhost:3000/api/orders/totals'
		} as NextRequest

		await GET(mockRequest)

		const responseData = (NextResponse.json as jest.Mock).mock.calls[0][0]

		expect(responseData.summary.subtotalPrice).toBe(33.33)
		expect(responseData.summary.totalTax).toBe(3.33)
		expect(responseData.summary.totalShipping).toBe(1.11)
		expect(responseData.summary.finalTotalPrice).toBe(37.78)
		expect(responseData.summary.currentSubtotalPrice).toBe(31.11)
		expect(responseData.summary.totalDiscounts).toBe(2.22)
	})

	it('handles Shopify API errors gracefully', async () => {
		const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
		const mockError = new Error('Shopify API Error')
		mockShopifyClient.get.mockRejectedValue(mockError)

		const mockRequest = {
			url: 'http://localhost:3000/api/orders/totals'
		} as NextRequest

		await GET(mockRequest)

		expect(NextResponse.json).toHaveBeenCalledWith(
			{ error: 'Failed to fetch orders with totals' },
			{ status: 500 }
		)
		expect(consoleSpy).toHaveBeenCalledWith(
			'Error fetching orders with totals:',
			mockError
		)

		consoleSpy.mockRestore()
	})

	it('includes proper explanation object', async () => {
		const mockRequest = {
			url: 'http://localhost:3000/api/orders/totals'
		} as NextRequest

		await GET(mockRequest)

		const responseData = (NextResponse.json as jest.Mock).mock.calls[0][0]

		expect(responseData.explanation).toEqual({
			subtotal_price: 'Price of line items before tax and shipping',
			current_subtotal_price: 'Subtotal after discounts are applied',
			total_tax: 'Total tax amount',
			total_shipping: 'Total shipping costs',
			total_discounts: 'Total discount amount',
			total_price:
				'Final price customer pays (subtotal + tax + shipping - discounts)'
		})
	})
})
