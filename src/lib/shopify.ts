import '@shopify/shopify-api/adapters/node'
import { shopifyApi, LATEST_API_VERSION, Session } from '@shopify/shopify-api'

// Initialize Shopify API client
export const shopify = shopifyApi({
	apiKey: process.env.SHOPIFY_API_KEY!,
	apiSecretKey: process.env.SHOPIFY_API_SECRET!,
	scopes: ['read_orders'],
	hostName: process.env.HOST_NAME!,
	apiVersion: LATEST_API_VERSION,
	isEmbeddedApp: false
})

// Create a reusable session for API calls
export function createShopifySession(): Session {
	return new Session({
		id: '1',
		shop: process.env.SHOPIFY_SHOP!,
		accessToken: process.env.SHOPIFY_ACCESS_TOKEN!,
		state: '',
		isOnline: false
	})
}

// Type definitions for Shopify orders
export interface ShopifyOrder {
	id: string | number
	name: string
	created_at: string
	subtotal_price: string
	total_tax: string
	total_shipping_price_set?: {
		shop_money?: {
			amount: string
		}
	}
	total_price: string
	current_subtotal_price: string
	total_discounts: string
	financial_status: string
	fulfillment_status: string
}

export interface ShopifyOrdersResponse {
	orders: ShopifyOrder[]
}

export interface OrderBreakdown {
	id: string | number
	name: string
	created_at: string
	subtotal_price: number
	total_tax: number
	total_shipping: number
	total_price: number
	current_subtotal_price: number
	total_discounts: number
	financial_status: string
	fulfillment_status: string
}

export interface OrderQueryParams {
	status: string
	fulfillment_status?: string
	limit: number
	created_at_min?: string
	created_at_max?: string
	[key: string]: string | number | undefined
}
