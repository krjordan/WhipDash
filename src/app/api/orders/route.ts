import { NextRequest, NextResponse } from 'next/server'
import {
	shopify,
	createShopifySession,
	type OrderQueryParams
} from '@/lib/shopify'

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const session = createShopifySession()
		const client = new shopify.clients.Rest({ session })

		const query: OrderQueryParams = {
			status: 'open',
			fulfillment_status: 'unfulfilled',
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

		const orders = await client.get({
			path: 'orders',
			query: Object.fromEntries(
				Object.entries(query).filter(([, value]) => value !== undefined)
			) as Record<string, string | number>
		})

		return NextResponse.json(orders)
	} catch (error) {
		console.error('Error fetching orders:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch orders' },
			{ status: 500 }
		)
	}
}
