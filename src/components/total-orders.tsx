'use client'

import * as React from 'react'
import { ShoppingCart, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/lib/session-context'

export function TotalOrders() {
	const { sessionState, ordersState, shopifyData, refreshShopifyData } =
		useSession()

	const getTrendingPercentage = () => {
		if (ordersState.lastSessionOrders === 0) {
			return ordersState.totalOrders > 0 ? 100 : 0
		}
		const change = ordersState.totalOrders - ordersState.lastSessionOrders
		return Math.round((change / ordersState.lastSessionOrders) * 100)
	}

	const getTrendingIcon = () => {
		const percentage = getTrendingPercentage()
		if (percentage > 0) {
			return (
				<TrendingUp
					className="h-3 w-3 text-green-600"
					aria-hidden="true"
				/>
			)
		} else if (percentage < 0) {
			return (
				<TrendingDown
					className="h-3 w-3 text-red-600"
					aria-hidden="true"
				/>
			)
		}
		return null
	}

	const formatTrendingText = () => {
		const percentage = getTrendingPercentage()
		if (ordersState.lastSessionOrders === 0 && ordersState.totalOrders === 0) {
			return 'No data from last session'
		}
		if (ordersState.lastSessionOrders === 0) {
			return 'New orders this session'
		}
		if (percentage === 0) {
			return 'Same as last session'
		}
		return `${percentage > 0 ? '+' : ''}${percentage}% from last session`
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">Total Orders</CardTitle>
				<div className="flex items-center gap-2">
					{sessionState.isStarted &&
						(shopifyData.lastUpdated || shopifyData.error) && (
							<button
								onClick={refreshShopifyData}
								disabled={shopifyData.loading}
								className="p-1 hover:bg-muted rounded-sm transition-colors"
								aria-label="Refresh order data"
							>
								<RefreshCw
									className={`h-3 w-3 text-muted-foreground ${
										shopifyData.loading ? 'animate-spin' : ''
									}`}
								/>
							</button>
						)}
					<ShoppingCart
						className="h-4 w-4 text-muted-foreground"
						aria-hidden="true"
					/>
				</div>
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">
					{sessionState.isStarted &&
					shopifyData.orderCount > 0 &&
					!shopifyData.error
						? shopifyData.orderCount
						: ordersState.totalOrders}
				</div>
				<p className="text-xs text-muted-foreground flex items-center gap-1">
					{getTrendingIcon()}
					<span aria-label={formatTrendingText()}>{formatTrendingText()}</span>
				</p>
				{sessionState.isStarted && (
					<div className="mt-2 text-xs text-muted-foreground">
						Last session: {ordersState.lastSessionOrders} orders
					</div>
				)}

				{/* Shopify data status - only show if we have Shopify data or errors */}
				{sessionState.isStarted &&
					(shopifyData.lastUpdated ||
						shopifyData.error ||
						shopifyData.loading) && (
						<div className="flex items-center gap-2 mt-3">
							<div
								className={`h-2 w-2 rounded-full ${
									shopifyData.error
										? 'bg-red-500'
										: shopifyData.loading
										? 'bg-orange-500 animate-pulse'
										: 'bg-green-500'
								}`}
							/>
							<span className="text-xs text-muted-foreground">
								{shopifyData.error
									? 'Shopify Connection Error'
									: shopifyData.loading
									? 'Loading...'
									: 'Live Shopify Data'}
							</span>
						</div>
					)}

				{/* Last updated indicator */}
				{sessionState.isStarted &&
					shopifyData.lastUpdated &&
					!shopifyData.error && (
						<div className="mt-2 text-xs text-muted-foreground">
							Updated: {shopifyData.lastUpdated.toLocaleTimeString()}
						</div>
					)}

				{/* Error message */}
				{sessionState.isStarted && shopifyData.error && (
					<div className="mt-2 p-2 rounded bg-red-50 border border-red-200">
						<p className="text-xs text-red-600">{shopifyData.error}</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
