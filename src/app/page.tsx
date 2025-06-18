import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import { PackageX } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { LiveDuration } from '@/components/live-duration'
import { LiveStatusBadge } from '@/components/live-status-badge'
import { SalesGoal } from '@/components/sales-goal'
import { TotalOrders } from '@/components/total-orders'
import { SessionProvider } from '@/lib/session-context'
import { RecentOrders } from '@/components/recent-orders'

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
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								<LiveDuration />

								<SalesGoal />

								<TotalOrders />
							</div>
						</section>

						{/* Recent Activity */}
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
							<RecentOrders />

							<Card className="col-span-3">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<PackageX className="h-5 w-5" />
										Sold Out Products
									</CardTitle>
									<CardDescription>
										Track products that are out of stock
									</CardDescription>
								</CardHeader>
								<CardContent className="flex items-center justify-center min-h-[300px]">
									<div className="text-center text-muted-foreground">
										<PackageX className="h-12 w-12 mx-auto mb-4 opacity-50" />
										<p className="text-lg font-medium">Coming Soon</p>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</main>
			</div>
		</SessionProvider>
	)
}
