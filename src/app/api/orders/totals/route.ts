import { NextRequest, NextResponse } from 'next/server'
import {
	shopify,
	createShopifySession,
	type OrderQueryParams,
	type ShopifyOrdersResponse,
	type ShopifyOrder,
	type OrderBreakdown
} from '@/lib/shopify'

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const session = createShopifySession()
		const client = new shopify.clients.Rest({ session })

		const query: OrderQueryParams = {
			status: 'any', // Get all orders regardless of status
			limit: 250
		}

		if (searchParams.get('today') === 'true') {
			const today = new Date()
			today.setHours(0, 0, 0, 0) // Start of today
			query.created_at_min = today.toISOString()
		} else {
			const createdAtMin = searchParams.get('created_at_min')
			if (createdAtMin) {
				query.created_at_min = createdAtMin
			}
		}

		const createdAtMax = searchParams.get('created_at_max')
		if (createdAtMax) {
			query.created_at_max = createdAtMax
		}

		// Add fields to include customer and line items data
		const queryWithFields = {
			...Object.fromEntries(
				Object.entries(query).filter(([, value]) => value !== undefined)
			),
			fields:
				'id,name,created_at,subtotal_price,total_tax,total_shipping_price_set,total_price,current_subtotal_price,total_discounts,financial_status,fulfillment_status,customer,line_items'
		} as Record<string, string | number>

		const orders = await client.get({
			path: 'orders',
			query: queryWithFields
		})

		const orderData = orders.body as ShopifyOrdersResponse
		const totals = {
			orderCount: orderData.orders.length,
			subtotal: 0, // Sum of line items before tax/shipping
			totalTax: 0, // Total tax amount
			totalShipping: 0, // Total shipping costs
			totalPrice: 0, // Final total (subtotal + tax + shipping)
			currentSubtotal: 0, // Current subtotal (after discounts)
			totalDiscounts: 0, // Total discounts applied
			orderBreakdown: [] as OrderBreakdown[]
		}

		orderData.orders.forEach((order: ShopifyOrder) => {
			// Process line items (with safety check for tests)
			const lineItems = (order.line_items || []).map((item) => ({
				id: item.id,
				title: item.title,
				price: parseFloat(item.price || '0'),
				quantity: item.quantity,
				total_discount: parseFloat(item.total_discount || '0'),
				line_total:
					parseFloat(item.price || '0') * item.quantity -
					parseFloat(item.total_discount || '0')
			}))

			// Process customer info
			let customerInfo = undefined
			if (order.customer) {
				customerInfo = {
					id: order.customer.id,
					first_name: order.customer.first_name,
					last_name: order.customer.last_name,
					email: order.customer.email
				}
			}

			const orderBreakdown = {
				id: order.id,
				name: order.name,
				created_at: order.created_at,
				subtotal_price: parseFloat(order.subtotal_price || '0'),
				total_tax: parseFloat(order.total_tax || '0'),
				total_shipping: parseFloat(
					order.total_shipping_price_set?.shop_money?.amount || '0'
				),
				total_price: parseFloat(order.total_price || '0'),
				current_subtotal_price: parseFloat(order.current_subtotal_price || '0'),
				total_discounts: parseFloat(order.total_discounts || '0'),
				financial_status: order.financial_status,
				fulfillment_status: order.fulfillment_status,
				customer: customerInfo,
				line_items: lineItems
			}

			totals.orderBreakdown.push(orderBreakdown)
			totals.subtotal += orderBreakdown.subtotal_price
			totals.totalTax += orderBreakdown.total_tax
			totals.totalShipping += orderBreakdown.total_shipping
			totals.totalPrice += orderBreakdown.total_price
			totals.currentSubtotal += orderBreakdown.current_subtotal_price
			totals.totalDiscounts += orderBreakdown.total_discounts
		})

		// Round to 2 decimal places
		totals.subtotal = Math.round(totals.subtotal * 100) / 100
		totals.totalTax = Math.round(totals.totalTax * 100) / 100
		totals.totalShipping = Math.round(totals.totalShipping * 100) / 100
		totals.totalPrice = Math.round(totals.totalPrice * 100) / 100
		totals.currentSubtotal = Math.round(totals.currentSubtotal * 100) / 100
		totals.totalDiscounts = Math.round(totals.totalDiscounts * 100) / 100

		// Add filter info to response
		const filterInfo: {
			dateFilter: string
			startDate?: string
			endDate?: string
		} = {
			dateFilter: 'none'
		}

		if (searchParams.get('today') === 'true') {
			filterInfo.dateFilter = 'today'
			filterInfo.startDate = new Date().toISOString().split('T')[0]
		} else {
			const createdAtMin = searchParams.get('created_at_min')
			const createdAtMax = searchParams.get('created_at_max')

			if (createdAtMin || createdAtMax) {
				filterInfo.dateFilter = 'custom'
				if (createdAtMin) filterInfo.startDate = createdAtMin
				if (createdAtMax) filterInfo.endDate = createdAtMax
			}
		}

		return NextResponse.json({
			filter: filterInfo,
			summary: {
				orderCount: totals.orderCount,
				subtotalPrice: totals.subtotal, // Price before tax/shipping
				currentSubtotalPrice: totals.currentSubtotal, // After discounts
				totalTax: totals.totalTax,
				totalShipping: totals.totalShipping,
				totalDiscounts: totals.totalDiscounts,
				finalTotalPrice: totals.totalPrice // This should be "total sales"
			},
			orders: totals.orderBreakdown,
			explanation: {
				subtotal_price: 'Price of line items before tax and shipping',
				current_subtotal_price: 'Subtotal after discounts are applied',
				total_tax: 'Total tax amount',
				total_shipping: 'Total shipping costs',
				total_discounts: 'Total discount amount',
				total_price:
					'Final price customer pays (subtotal + tax + shipping - discounts)'
			}
		})
	} catch (error) {
		console.error('Error fetching orders with totals:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch orders with totals' },
			{ status: 500 }
		)
	}
}
