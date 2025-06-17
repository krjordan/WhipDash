import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LiveDuration } from '@/components/live-duration'
import { LiveStatusBadge } from '@/components/live-status-badge'
import { SessionProvider } from '@/lib/session-context'
import {
	TrendingUp,
	TrendingDown,
	Users,
	ShoppingCart,
	Activity
} from 'lucide-react'

export default function Dashboard() {
	return (
		<SessionProvider>
			<div className="min-h-screen bg-background">
				{/* Skip to main content link for keyboard navigation */}
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-3 py-2 rounded-md z-50"
				>
					Skip to main content
				</a>

				{/* Header */}
				<header className="border-b border-border bg-card">
					<div className="container mx-auto px-4 py-4 flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-foreground">ZestDash</h1>
							<p className="text-sm text-muted-foreground">
								Live Sales Dashboard
							</p>
						</div>
						<div className="flex items-center gap-4">
							<LiveStatusBadge />
							<ThemeToggle />
						</div>
					</div>
				</header>

				{/* Main Dashboard */}
				<main
					id="main-content"
					className="container mx-auto px-4 py-8"
				>
					<div className="grid gap-6">
						{/* Stats Overview */}
						<section aria-labelledby="stats-heading">
							<h2
								id="stats-heading"
								className="sr-only"
							>
								Dashboard Statistics Overview
							</h2>
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
								<LiveDuration />

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">
											Subscriptions
										</CardTitle>
										<Users
											className="h-4 w-4 text-muted-foreground"
											aria-hidden="true"
										/>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">+2,350</div>
										<p className="text-xs text-muted-foreground flex items-center gap-1">
											<TrendingUp
												className="h-3 w-3 text-green-600"
												aria-hidden="true"
											/>
											<span aria-label="Up 180.1 percent from last month">
												+180.1% from last month
											</span>
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">Sales</CardTitle>
										<ShoppingCart
											className="h-4 w-4 text-muted-foreground"
											aria-hidden="true"
										/>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">+12,234</div>
										<p className="text-xs text-muted-foreground flex items-center gap-1">
											<TrendingUp
												className="h-3 w-3 text-green-600"
												aria-hidden="true"
											/>
											<span aria-label="Up 19 percent from last month">
												+19% from last month
											</span>
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">
											Active Now
										</CardTitle>
										<Activity
											className="h-4 w-4 text-muted-foreground"
											aria-hidden="true"
										/>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">+573</div>
										<p className="text-xs text-muted-foreground flex items-center gap-1">
											<TrendingDown
												className="h-3 w-3 text-red-600"
												aria-hidden="true"
											/>
											<span aria-label="Down 2 percent from last hour">
												-2% from last hour
											</span>
										</p>
									</CardContent>
								</Card>
							</div>
						</section>

						{/* Recent Activity */}
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
							<Card className="col-span-4">
								<CardHeader>
									<CardTitle>Recent Sales</CardTitle>
									<CardDescription>
										You made 265 sales this month.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div
										className="space-y-8"
										role="list"
										aria-label="Recent sales transactions"
									>
										{[
											{
												name: 'Olivia Martin',
												email: 'olivia.martin@email.com',
												amount: '+$1,999.00'
											},
											{
												name: 'Jackson Lee',
												email: 'jackson.lee@email.com',
												amount: '+$39.00'
											},
											{
												name: 'Isabella Nguyen',
												email: 'isabella.nguyen@email.com',
												amount: '+$299.00'
											},
											{
												name: 'William Kim',
												email: 'will@email.com',
												amount: '+$99.00'
											},
											{
												name: 'Sofia Davis',
												email: 'sofia.davis@email.com',
												amount: '+$39.00'
											}
										].map((sale) => (
											<div
												key={sale.email}
												className="flex items-center"
												role="listitem"
												aria-label={`Sale to ${sale.name} for ${sale.amount}`}
											>
												<div className="ml-4 space-y-1">
													<p className="text-sm font-medium leading-none">
														{sale.name}
													</p>
													<p className="text-sm text-muted-foreground">
														{sale.email}
													</p>
												</div>
												<div
													className="ml-auto font-medium"
													aria-label={`Amount: ${sale.amount}`}
												>
													{sale.amount}
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>

							<Card className="col-span-3">
								<CardHeader>
									<CardTitle>Quick Actions</CardTitle>
									<CardDescription>
										Manage your dashboard settings
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<Button
										className="w-full"
										variant="default"
										aria-describedby="generate-report-desc"
									>
										Generate Report
									</Button>
									<span
										id="generate-report-desc"
										className="sr-only"
									>
										Create a comprehensive sales report for the current period
									</span>

									<Button
										className="w-full"
										variant="outline"
										aria-describedby="export-data-desc"
									>
										Export Data
									</Button>
									<span
										id="export-data-desc"
										className="sr-only"
									>
										Download dashboard data as CSV or Excel file
									</span>

									<Button
										className="w-full"
										variant="secondary"
										aria-describedby="view-analytics-desc"
									>
										View Analytics
									</Button>
									<span
										id="view-analytics-desc"
										className="sr-only"
									>
										Open detailed analytics and insights page
									</span>
								</CardContent>
							</Card>
						</div>
					</div>
				</main>
			</div>
		</SessionProvider>
	)
}
