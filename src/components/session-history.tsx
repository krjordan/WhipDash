'use client'

import * as React from 'react'
import {
	History,
	Calendar,
	ShoppingCart,
	DollarSign,
	Target,
	Trash2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/session-context'

export function SessionHistory() {
	const { ordersState, clearOrdersHistory } = useSession()
	const [mounted, setMounted] = React.useState(false)

	React.useEffect(() => {
		setMounted(true)
	}, [])

	const formatCurrency = (amount: number) => {
		if (!mounted) return '$0.00'
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount)
	}

	const formatDate = (dateString: string) => {
		if (!mounted) return ''
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})
	}

	const formatTime = (dateString: string) => {
		if (!mounted) return ''
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit'
		})
	}

	const getSessionDuration = (startTime: string, endTime?: string) => {
		if (!mounted) return ''
		const start = new Date(startTime)
		const end = endTime ? new Date(endTime) : new Date()
		const duration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60) // minutes

		if (duration < 60) {
			return `${duration}m`
		}
		const hours = Math.floor(duration / 60)
		const minutes = duration % 60
		return `${hours}h ${minutes}m`
	}

	const getPerformanceComparison = (
		currentOrders: number,
		previousOrders: number
	) => {
		if (previousOrders === 0)
			return { percentage: 0, direction: 'none' as const }

		const change = ((currentOrders - previousOrders) / previousOrders) * 100
		return {
			percentage: Math.abs(Math.round(change)),
			direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
		} as const
	}

	if (!mounted || ordersState.ordersHistory.length === 0) {
		return (
			<Card className="col-span-2">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<History className="h-5 w-5" />
						Session History
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 text-muted-foreground">
						<History className="h-12 w-12 mx-auto mb-4 opacity-50" />
						<p>{!mounted ? 'Loading...' : 'No session history yet'}</p>
						{mounted && (
							<p className="text-xs mt-1">
								Complete a session to see your performance history
							</p>
						)}
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className="col-span-2">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<History className="h-5 w-5" />
						Session History
					</CardTitle>
					<Button
						variant="ghost"
						size="sm"
						onClick={clearOrdersHistory}
						className="text-muted-foreground hover:text-destructive"
						aria-label="Clear session history"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
				<p className="text-sm text-muted-foreground">
					{ordersState.ordersHistory.length} completed session
					{ordersState.ordersHistory.length !== 1 ? 's' : ''}
				</p>
			</CardHeader>
			<CardContent>
				{/* Scrollable container */}
				<div className="h-80 overflow-y-auto pr-2">
					<div className="space-y-4">
						{ordersState.ordersHistory
							.slice(-10) // Show last 10 sessions
							.reverse() // Most recent first
							.map((session, index) => {
								const isLatest = index === 0
								const previousSession =
									ordersState.ordersHistory[
										ordersState.ordersHistory.length - index - 2
									]
								const comparison = previousSession
									? getPerformanceComparison(
											session.totalOrders,
											previousSession.totalOrders
									  )
									: { percentage: 0, direction: 'none' as const }

								return (
									<div
										key={session.sessionId}
										className={`p-4 rounded-lg border ${
											isLatest
												? 'bg-muted/50 border-primary/20'
												: 'bg-background'
										}`}
									>
										{/* Session Header */}
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center gap-2">
												<Calendar className="h-4 w-4 text-muted-foreground" />
												<div>
													<p className="font-medium text-sm">
														{formatDate(session.startTime)}
													</p>
													<p className="text-xs text-muted-foreground">
														{formatTime(session.startTime)} -{' '}
														{session.endTime
															? formatTime(session.endTime)
															: 'Active'}
														{session.endTime &&
															` (${getSessionDuration(
																session.startTime,
																session.endTime
															)})`}
													</p>
												</div>
											</div>
											{isLatest && (
												<span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
													Latest
												</span>
											)}
										</div>

										{/* Session Stats */}
										<div className="grid grid-cols-2 gap-4 mb-3">
											<div className="flex items-center gap-2">
												<ShoppingCart className="h-4 w-4 text-muted-foreground" />
												<div>
													<p className="text-sm font-medium">
														{session.totalOrders}
													</p>
													<p className="text-xs text-muted-foreground">
														Orders
													</p>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<DollarSign className="h-4 w-4 text-muted-foreground" />
												<div>
													<p className="text-sm font-medium">
														{formatCurrency(session.totalSales)}
													</p>
													<p className="text-xs text-muted-foreground">Sales</p>
												</div>
											</div>
										</div>

										{/* Goal Progress */}
										<div className="flex items-center gap-2 mb-3">
											<Target className="h-4 w-4 text-muted-foreground" />
											<div className="flex-1">
												<div className="flex items-center justify-between text-xs">
													<span className="text-muted-foreground">
														Goal Progress
													</span>
													<span className="font-medium">
														{Math.round(
															(session.totalSales / session.goalAmount) * 100
														)}
														%
													</span>
												</div>
												<div className="w-full bg-muted rounded-full h-2 mt-1">
													<div
														className={`h-2 rounded-full transition-all ${
															session.totalSales >= session.goalAmount
																? 'bg-green-500'
																: 'bg-primary'
														}`}
														style={{
															width: `${Math.min(
																(session.totalSales / session.goalAmount) * 100,
																100
															)}%`
														}}
													/>
												</div>
											</div>
										</div>

										{/* Performance Comparison */}
										{comparison.direction !== 'none' && (
											<div className="flex items-center gap-1 text-xs">
												<span className="text-muted-foreground">
													vs previous:
												</span>
												<span
													className={`font-medium ${
														comparison.direction === 'up'
															? 'text-green-600'
															: comparison.direction === 'down'
															? 'text-red-600'
															: 'text-muted-foreground'
													}`}
												>
													{comparison.direction === 'up' && '+'}
													{comparison.direction === 'down' && '-'}
													{comparison.percentage}%
												</span>
											</div>
										)}
									</div>
								)
							})}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
