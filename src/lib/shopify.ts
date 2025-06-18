import '@shopify/shopify-api/adapters/node'
import { shopifyApi, LATEST_API_VERSION, Session } from '@shopify/shopify-api'

// Lazy initialization of Shopify API client
let shopifyInstance: ReturnType<typeof shopifyApi> | null = null

function getShopifyApi() {
	if (!shopifyInstance) {
		// Check for required environment variables
		const requiredEnvVars = {
			apiKey: process.env.SHOPIFY_API_KEY,
			apiSecretKey: process.env.SHOPIFY_API_SECRET,
			hostName: process.env.HOST_NAME,
			shop: process.env.SHOPIFY_SHOP,
			accessToken: process.env.SHOPIFY_ACCESS_TOKEN
		}

		// Check if any required variables are missing
		const missingVars = Object.entries(requiredEnvVars)
			.filter(([, value]) => !value)
			.map(([key]) => key)

		if (missingVars.length > 0) {
			throw new Error(
				`Missing required Shopify environment variables: ${missingVars.join(
					', '
				)}`
			)
		}

		shopifyInstance = shopifyApi({
			apiKey: requiredEnvVars.apiKey!,
			apiSecretKey: requiredEnvVars.apiSecretKey!,
			scopes: ['read_orders'],
			hostName: requiredEnvVars.hostName!,
			apiVersion: LATEST_API_VERSION,
			isEmbeddedApp: false
		})
	}

	return shopifyInstance
}

// Export a getter function instead of the instance directly
export const shopify = {
	get clients() {
		return getShopifyApi().clients
	}
}

// Create a reusable session for API calls
export function createShopifySession(): Session {
	const shop = process.env.SHOPIFY_SHOP
	const accessToken = process.env.SHOPIFY_ACCESS_TOKEN

	if (!shop || !accessToken) {
		throw new Error(
			'Missing required Shopify session environment variables: SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN'
		)
	}

	return new Session({
		id: '1',
		shop,
		accessToken,
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
