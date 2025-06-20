'use client'

import * as React from 'react'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import {
	History,
	Calendar,
	ShoppingCart,
	DollarSign,
	Target,
	Trash2,
	TrendingUp,
	TrendingDown,
	Clock,
	BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/session-context'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'

function SessionHistoryContent() {
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
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
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
			return `${duration} minutes`
		}
		const hours = Math.floor(duration / 60)
		const minutes = duration % 60
		return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${
			minutes !== 1 ? 's' : ''
		}`
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

	const getAverageOrderValue = (totalSales: number, totalOrders: number) => {
		if (totalOrders === 0) return 0
		return totalSales / totalOrders
	}

	const calculateStats = () => {
		if (!mounted || ordersState.ordersHistory.length === 0) {
			return {
				totalSessions: 0,
				totalRevenue: 0,
				totalOrders: 0,
				averageSessionRevenue: 0,
				averageOrderValue: 0,
				bestSession: null,
				averageSessionDuration: 0
			}
		}

		const totalSessions = ordersState.ordersHistory.length
		const totalRevenue = ordersState.ordersHistory.reduce(
			(sum, session) => sum + session.totalSales,
			0
		)
		const totalOrders = ordersState.ordersHistory.reduce(
			(sum, session) => sum + session.totalOrders,
			0
		)
		const averageSessionRevenue = totalRevenue / totalSessions
		const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

		const bestSession =
			ordersState.ordersHistory.length > 0
				? ordersState.ordersHistory.reduce((best, session) =>
						session.totalSales > best.totalSales ? session : best
				  )
				: null

		const totalDuration = ordersState.ordersHistory.reduce((sum, session) => {
			const start = new Date(session.startTime)
			const end = session.endTime ? new Date(session.endTime) : new Date()
			return sum + Math.floor((end.getTime() - start.getTime()) / 1000 / 60)
		}, 0)
		const averageSessionDuration = totalDuration / totalSessions

		return {
			totalSessions,
			totalRevenue,
			totalOrders,
			averageSessionRevenue,
			averageOrderValue,
			bestSession,
			averageSessionDuration
		}
	}

	const stats = calculateStats()

	if (!mounted) {
		return (
			<div className="flex-1 p-6 bg-background">
				<div className="text-center py-8">
					<p>Loading...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="flex-1 p-6 bg-background">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Session History</h1>
					<p className="text-muted-foreground">
						Comprehensive view of your sales session performance
					</p>
				</div>
				<div className="flex items-center gap-4">
					<Link href="/">
						<Button
							variant="outline"
							size="sm"
						>
							<BarChart3 className="h-4 w-4 mr-2" />
							Back to Dashboard
						</Button>
					</Link>
					{ordersState.ordersHistory.length > 0 && (
						<Button
							variant="destructive"
							size="sm"
							onClick={clearOrdersHistory}
						>
							<Trash2 className="h-4 w-4 mr-2" />
							Clear History
						</Button>
					)}
				</div>
			</div>

			{ordersState.ordersHistory.length === 0 ? (
				<Card>
					<CardContent className="flex items-center justify-center py-16">
						<div className="text-center">
							<History className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold mb-2">
								No session history yet
							</h3>
							<p className="text-muted-foreground mb-6 max-w-sm">
								Start a new session on the dashboard to begin tracking your
								sales data and performance metrics.
							</p>
							<Link href="/">
								<Button>
									<BarChart3 className="h-4 w-4 mr-2" />
									Go to Dashboard
								</Button>
							</Link>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-6">
					{/* Summary Statistics */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Sessions
								</CardTitle>
								<Calendar className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{stats.totalSessions}</div>
								<p className="text-xs text-muted-foreground">
									Avg: {Math.round(stats.averageSessionDuration)} minutes
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Revenue
								</CardTitle>
								<DollarSign className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{formatCurrency(stats.totalRevenue)}
								</div>
								<p className="text-xs text-muted-foreground">
									Avg per session: {formatCurrency(stats.averageSessionRevenue)}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Orders
								</CardTitle>
								<ShoppingCart className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{stats.totalOrders}</div>
								<p className="text-xs text-muted-foreground">
									AOV: {formatCurrency(stats.averageOrderValue)}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Best Session
								</CardTitle>
								<Target className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{stats.bestSession
										? formatCurrency(stats.bestSession.totalSales)
										: '$0.00'}
								</div>
								<p className="text-xs text-muted-foreground">
									{stats.bestSession
										? `${stats.bestSession.totalOrders} orders`
										: 'No sessions yet'}
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Session History List */}
					<Card>
						<CardHeader>
							<CardTitle>Recent Sessions</CardTitle>
							<CardDescription>
								Detailed breakdown of your sales session performance
							</CardDescription>
						</CardHeader>
						<CardContent>
							{/* Scrollable container with fixed height */}
							<div
								className="h-96 overflow-y-auto pr-2"
								data-testid="session-list"
							>
								<div className="space-y-4">
									{ordersState.ordersHistory
										.slice()
										.reverse()
										.map((session, index) => {
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
													key={session.startTime}
													className="flex items-center justify-between p-4 border rounded-lg bg-card"
												>
													<div className="flex-1 space-y-1">
														<div className="flex items-center gap-2">
															<h4 className="font-semibold">
																{formatDate(session.startTime)}
															</h4>
															<span className="text-sm text-muted-foreground">
																{formatTime(session.startTime)}
															</span>
															{session.endTime && (
																<span className="text-sm text-muted-foreground">
																	- {formatTime(session.endTime)}
																</span>
															)}
														</div>
														<div className="flex items-center gap-4 text-sm text-muted-foreground">
															<div className="flex items-center gap-1">
																<Clock className="h-3 w-3" />
																{getSessionDuration(
																	session.startTime,
																	session.endTime
																)}
															</div>
															<div className="flex items-center gap-1">
																<ShoppingCart className="h-3 w-3" />
																{session.totalOrders} orders
															</div>
															<div className="flex items-center gap-1">
																<DollarSign className="h-3 w-3" />
																{formatCurrency(
																	getAverageOrderValue(
																		session.totalSales,
																		session.totalOrders
																	)
																)}{' '}
																AOV
															</div>
														</div>
													</div>
													<div className="flex items-center gap-4">
														{comparison.direction !== 'none' && (
															<div
																className={`flex items-center gap-1 text-sm ${
																	comparison.direction === 'up'
																		? 'text-green-600'
																		: 'text-red-600'
																}`}
															>
																{comparison.direction === 'up' ? (
																	<TrendingUp className="h-3 w-3" />
																) : (
																	<TrendingDown className="h-3 w-3" />
																)}
																{comparison.percentage}%
															</div>
														)}
														<div className="text-right">
															<div className="font-semibold">
																{formatCurrency(session.totalSales)}
															</div>
															<div className="text-sm text-muted-foreground">
																{session.goalAmount > 0 && (
																	<>
																		{Math.round(
																			(session.totalSales /
																				session.goalAmount) *
																				100
																		)}
																		% of goal
																	</>
																)}
															</div>
														</div>
													</div>
												</div>
											)
										})}
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	)
}

export default function SessionHistoryPage() {
	return (
		<DashboardLayout>
			<SessionHistoryContent />
		</DashboardLayout>
	)
}
