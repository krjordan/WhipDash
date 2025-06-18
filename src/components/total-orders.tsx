'use client'

import * as React from 'react'
import { ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/lib/session-context'

export function TotalOrders() {
	const { sessionState, ordersState } = useSession()

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
				<ShoppingCart
					className="h-4 w-4 text-muted-foreground"
					aria-hidden="true"
				/>
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{ordersState.totalOrders}</div>
				<p className="text-xs text-muted-foreground flex items-center gap-1">
					{getTrendingIcon()}
					<span aria-label={formatTrendingText()}>{formatTrendingText()}</span>
				</p>
				{sessionState.isStarted && (
					<div className="mt-2 text-xs text-muted-foreground">
						Last session: {ordersState.lastSessionOrders} orders
					</div>
				)}
			</CardContent>
		</Card>
	)
}
