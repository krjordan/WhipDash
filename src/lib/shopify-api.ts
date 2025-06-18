import { useState, useEffect, useCallback } from 'react'

// Types matching our API responses
export interface OrderTotalsResponse {
	filter: {
		dateFilter: string
		startDate?: string
		endDate?: string
	}
	summary: {
		orderCount: number
		subtotalPrice: number
		currentSubtotalPrice: number
		totalTax: number
		totalShipping: number
		totalDiscounts: number
		finalTotalPrice: number
	}
	orders: Array<{
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
		customer?: {
			id: string | number
			first_name: string
			last_name: string
			email: string
		}
		line_items: Array<{
			id: string | number
			title: string
			price: number
			quantity: number
			total_discount: number
		}>
	}>
	explanation: Record<string, string>
}

export interface ApiError {
	error: string
}

// Hook for fetching order totals with optional date filtering
export function useOrderTotals(options?: {
	today?: boolean
	created_at_min?: string
	created_at_max?: string
	refreshInterval?: number
	enabled?: boolean
}) {
	const [data, setData] = useState<OrderTotalsResponse | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchOrderTotals = useCallback(async () => {
		if (options?.enabled === false) return

		setLoading(true)
		setError(null)

		try {
			const params = new URLSearchParams()

			if (options?.today) {
				params.append('today', 'true')
			} else {
				if (options?.created_at_min) {
					params.append('created_at_min', options.created_at_min)
				}
				if (options?.created_at_max) {
					params.append('created_at_max', options.created_at_max)
				}
			}

			const url = `/api/orders/totals${
				params.toString() ? `?${params.toString()}` : ''
			}`
			const response = await fetch(url)

			if (!response.ok) {
				const errorData: ApiError = await response.json()
				throw new Error(errorData.error || 'Failed to fetch order totals')
			}

			const result: OrderTotalsResponse = await response.json()
			setData(result)
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Unknown error occurred'
			setError(errorMessage)
			console.error('Error fetching order totals:', err)
		} finally {
			setLoading(false)
		}
	}, [
		options?.today,
		options?.created_at_min,
		options?.created_at_max,
		options?.enabled
	])

	// Initial fetch - only if enabled
	useEffect(() => {
		if (options?.enabled !== false) {
			fetchOrderTotals()
		}
	}, [fetchOrderTotals, options?.enabled])

	// Set up polling if refreshInterval is provided
	useEffect(() => {
		if (!options?.refreshInterval || options?.enabled === false) return

		const interval = setInterval(fetchOrderTotals, options.refreshInterval)
		return () => clearInterval(interval)
	}, [fetchOrderTotals, options?.refreshInterval, options?.enabled])

	return {
		data,
		loading,
		error,
		refetch: fetchOrderTotals
	}
}

// Utility function to check API health
export async function checkApiHealth(): Promise<boolean> {
	try {
		const response = await fetch('/api/health')
		return response.ok
	} catch {
		return false
	}
}

// Helper to format date for API calls
export function formatDateForApi(date: Date): string {
	return date.toISOString().split('T')[0]
}

// Helper to get today's date range
export function getTodayDateRange() {
	const today = new Date()
	const startOfDay = new Date(today)
	startOfDay.setHours(0, 0, 0, 0)

	const endOfDay = new Date(today)
	endOfDay.setHours(23, 59, 59, 999)

	return {
		start: formatDateForApi(startOfDay),
		end: formatDateForApi(endOfDay)
	}
}
