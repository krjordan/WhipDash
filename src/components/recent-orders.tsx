'use client'

import * as React from 'react'
import { RefreshCw, ShoppingCart, User, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/lib/session-context'

export function RecentOrders() {
	const { sessionState, shopifyData, ordersState, refreshShopifyData } =
		useSession()
	const [mounted, setMounted] = React.useState(false)

	React.useEffect(() => {
		setMounted(true)
	}, [])

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount)
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		})
	}

	// Transform the actual order data from shopify context into display format
	const ordersToDisplay = React.useMemo(() => {
		// Prevent hydration mismatches by returning empty array until mounted
		if (!mounted) {
			return []
		}

		// When session is started and we have shopify data, use the actual orders
		if (
			sessionState.isStarted &&
			shopifyData.lastUpdated &&
			!shopifyData.error &&
			shopifyData.orders.length > 0
		) {
			// Use the actual order data from the API, limited to 5 most recent orders
			return shopifyData.orders
				.slice(0, 5) // Show only the 5 most recent orders
				.map((order) => ({
					id: order.id,
					orderNumber: order.name, // This is the actual order number like "#1001"
					customerName: order.customer
						? `${order.customer.first_name} ${order.customer.last_name}`.trim()
						: 'Guest Customer',
					customerEmail: order.customer?.email || '',
					totalPrice: order.total_price,
					createdAt: order.created_at,
					source: 'shopify' as const,
					lineItems: order.line_items.map((item) => ({
						id: item.id,
						name: item.title,
						quantity: item.quantity,
						price: item.price,
						totalDiscount: item.total_discount
					}))
				}))
		}

		// When session is active but no Shopify data, show persisted orders from current session
		if (sessionState.isStarted && ordersState.currentSessionOrders.length > 0) {
			return ordersState.currentSessionOrders
				.slice(-5) // Show the 5 most recent orders
				.reverse() // Show most recent first
				.map((order) => ({
					id: order.id,
					orderNumber: order.orderNumber || `Order ${order.id.slice(-6)}`,
					customerName: order.customerName || 'Unknown Customer',
					customerEmail: '',
					totalPrice: order.totalPrice,
					createdAt: order.timestamp,
					source: order.source,
					lineItems:
						order.shopifyData?.line_items?.map((item) => ({
							id: item.id,
							name: item.title,
							quantity: item.quantity,
							price: item.price,
							totalDiscount: item.total_discount
						})) || []
				}))
		}

		// When session is not started or we have errors, show last session data if available
		if (
			mounted &&
			!sessionState.isStarted &&
			ordersState.currentSessionOrders.length > 0
		) {
			return ordersState.currentSessionOrders
				.slice(-5) // Show the 5 most recent orders
				.reverse() // Show most recent first
				.map((order) => ({
					id: order.id,
					orderNumber: order.orderNumber || `Order ${order.id.slice(-6)}`,
					customerName: order.customerName || 'Unknown Customer',
					customerEmail: '',
					totalPrice: order.totalPrice,
					createdAt: order.timestamp,
					source: order.source,
					lineItems:
						order.shopifyData?.line_items?.map((item) => ({
							id: item.id,
							name: item.title,
							quantity: item.quantity,
							price: item.price,
							totalDiscount: item.total_discount
						})) || []
				}))
		}

		// When no data available at all
		return []
	}, [
		mounted,
		sessionState.isStarted,
		shopifyData.lastUpdated,
		shopifyData.error,
		shopifyData.orders,
		ordersState.currentSessionOrders
	])

	const getDataSource = () => {
		if (!mounted) {
			return 'Start a session to view recent orders'
		}

		if (
			sessionState.isStarted &&
			shopifyData.lastUpdated &&
			!shopifyData.error
		) {
			return `${shopifyData.orderCount} orders in the last 7 days (Live Shopify Data)`
		}
		if (sessionState.isStarted && ordersState.currentSessionOrders.length > 0) {
			return `${ordersState.currentSessionOrders.length} orders this session (Stored Locally)`
		}
		if (
			!sessionState.isStarted &&
			ordersState.currentSessionOrders.length > 0
		) {
			return `${ordersState.currentSessionOrders.length} orders from last session`
		}
		return 'Start a session to view recent orders'
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<ShoppingCart className="h-5 w-5" />
							Recent Orders
						</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">
							{getDataSource()}
						</p>
					</div>
					{mounted && sessionState.isStarted && (
						<button
							onClick={refreshShopifyData}
							disabled={shopifyData.loading}
							className="p-2 hover:bg-muted rounded-sm transition-colors"
							aria-label="Refresh recent orders"
						>
							<RefreshCw
								className={`h-4 w-4 text-muted-foreground ${
									shopifyData.loading ? 'animate-spin' : ''
								}`}
							/>
						</button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{mounted && shopifyData.error && sessionState.isStarted && (
					<div className="mb-4 p-3 rounded bg-red-50 border border-red-200">
						<p className="text-sm text-red-600">{shopifyData.error}</p>
					</div>
				)}

				{/* Scrollable container with fixed height */}
				<div className="h-80 overflow-y-auto pr-2">
					<div className="space-y-6">
						{ordersToDisplay.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>
									{mounted && sessionState.isStarted
										? 'No recent orders found'
										: 'Start a session to view recent orders'}
								</p>
							</div>
						) : (
							ordersToDisplay.map((order) => (
								<div
									key={order.id}
									className="border-b border-border pb-4 last:border-b-0 last:pb-0"
								>
									{/* Customer Header */}
									<div className="flex items-center justify-between mb-3">
										<div className="flex items-center gap-3">
											<div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
												{order.source === 'shopify' ? (
													<User className="h-4 w-4 text-muted-foreground" />
												) : (
													<Calendar className="h-4 w-4 text-muted-foreground" />
												)}
											</div>
											<div>
												<p className="font-medium text-sm">
													{order.customerName}
												</p>
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<span>{order.orderNumber}</span>
													<span>•</span>
													<span>{formatDate(order.createdAt)}</span>
													{order.source === 'manual' && (
														<>
															<span>•</span>
															<span className="text-orange-600 font-medium">
																Test Order
															</span>
														</>
													)}
												</div>
											</div>
										</div>
										<div className="text-right">
											<p className="font-medium text-sm">
												Total: {formatCurrency(order.totalPrice)}
											</p>
										</div>
									</div>

									{/* Line Items - show for orders with line item data */}
									{order.lineItems && order.lineItems.length > 0 && (
										<div className="ml-11 space-y-1">
											{order.lineItems.map((item) => (
												<div
													key={item.id}
													className="flex items-center justify-between text-sm"
												>
													<div className="flex items-center gap-2">
														<span className="text-muted-foreground">-</span>
														<span className="text-muted-foreground">
															{item.name}
															{item.quantity > 1 && ` (×${item.quantity})`}
														</span>
													</div>
													<span className="font-medium">
														{formatCurrency(item.price * item.quantity)}
													</span>
												</div>
											))}
										</div>
									)}
								</div>
							))
						)}
					</div>
				</div>

				{/* Status indicator */}
				{mounted && sessionState.isStarted && (
					<div className="flex items-center gap-2 mt-4 pt-4 border-t">
						<div
							className={`h-2 w-2 rounded-full ${
								shopifyData.error
									? 'bg-red-500'
									: shopifyData.loading
									? 'bg-orange-500 animate-pulse'
									: shopifyData.lastUpdated
									? 'bg-green-500'
									: ordersState.currentSessionOrders.length > 0
									? 'bg-blue-500'
									: 'bg-gray-400'
							}`}
						/>
						<span className="text-xs text-muted-foreground">
							{shopifyData.error
								? 'Connection Error'
								: shopifyData.loading
								? 'Loading orders...'
								: shopifyData.lastUpdated
								? `Last updated: ${shopifyData.lastUpdated.toLocaleTimeString()}`
								: ordersState.currentSessionOrders.length > 0
								? `${ordersState.currentSessionOrders.length} orders stored locally`
								: 'Waiting for data'}
						</span>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
