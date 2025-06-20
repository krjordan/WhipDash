'use client'
import { Info, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LiveDuration } from '@/components/live-duration'
import { SalesGoal } from '@/components/sales-goal'
import { TotalOrders } from '@/components/total-orders'
import { RecentOrders } from '@/components/recent-orders'
import { SoldOutProducts } from '@/components/sold-out-products'
import { DashboardLayout } from '@/components/dashboard-layout'
import { useSession } from '@/lib/session-context'
import React from 'react'

function DashboardContent() {
	const { sessionState, ordersState, openSessionModal } = useSession()
	const [mounted, setMounted] = React.useState(false)

	React.useEffect(() => {
		setMounted(true)
	}, [])

	const formatDate = (dateString: string) => {
		if (!mounted) return ''
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		})
	}

	return (
		<main className="flex-1 p-6 bg-background overflow-auto">
			{/* Skip to main content anchor */}
			<div
				id="main-content"
				aria-hidden="true"
				className="sr-only"
			>
				Main Dashboard Content
			</div>

			{/* Previous Session Banner */}
			{mounted && !sessionState.isStarted && ordersState.lastSessionData && (
				<div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
					<div className="flex items-center justify-between">
						<div className="flex items-start gap-3">
							<Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
							<div>
								<h3 className="font-medium text-blue-900 dark:text-blue-100">
									Viewing Previous Session Data
								</h3>
								<p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
									Last session ended on{' '}
									{ordersState.lastSessionData.endTime &&
										formatDate(ordersState.lastSessionData.endTime)}
									. Start a new session to begin tracking live data.
								</p>
							</div>
						</div>
						<Button
							onClick={openSessionModal}
							className="bg-blue-600 hover:bg-blue-700 text-white"
							size="sm"
						>
							<Play className="h-4 w-4 mr-2" />
							Start New Session
						</Button>
					</div>
				</div>
			)}

			<div className="grid gap-6">
				{/* Stats Overview */}
				<section aria-labelledby="stats-heading">
					<h2
						id="stats-heading"
						className="sr-only"
					>
						Dashboard Statistics Overview
					</h2>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						<LiveDuration />

						<SalesGoal />

						<TotalOrders />
					</div>
				</section>

				{/* Recent Activity */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					<div className="col-span-2">
						<RecentOrders />
					</div>

					<SoldOutProducts />
				</div>
			</div>
		</main>
	)
}

export default function Dashboard() {
	return (
		<DashboardLayout>
			<DashboardContent />
		</DashboardLayout>
	)
}
