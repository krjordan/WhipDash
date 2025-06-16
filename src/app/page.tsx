import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LiveDuration } from '@/components/live-duration'
import {
	TrendingUp,
	TrendingDown,
	Users,
	ShoppingCart,
	Activity
} from 'lucide-react'

export default function Dashboard() {
	return (
		<div className="min-h-screen bg-background">
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
						<Badge
							variant="outline"
							className="text-green-600 border-green-600"
						>
							Live
						</Badge>
						<ThemeToggle />
					</div>
				</div>
			</header>

			{/* Main Dashboard */}
			<main className="container mx-auto px-4 py-8">
				<div className="grid gap-6">
					{/* Stats Overview */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<LiveDuration />

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Subscriptions
								</CardTitle>
								<Users className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">+2,350</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1">
									<TrendingUp className="h-3 w-3 text-green-600" />
									+180.1% from last month
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Sales</CardTitle>
								<ShoppingCart className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">+12,234</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1">
									<TrendingUp className="h-3 w-3 text-green-600" />
									+19% from last month
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Active Now
								</CardTitle>
								<Activity className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">+573</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1">
									<TrendingDown className="h-3 w-3 text-red-600" />
									-2% from last hour
								</p>
							</CardContent>
						</Card>
					</div>

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
								<div className="space-y-8">
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
										>
											<div className="ml-4 space-y-1">
												<p className="text-sm font-medium leading-none">
													{sale.name}
												</p>
												<p className="text-sm text-muted-foreground">
													{sale.email}
												</p>
											</div>
											<div className="ml-auto font-medium">{sale.amount}</div>
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
								>
									Generate Report
								</Button>
								<Button
									className="w-full"
									variant="outline"
								>
									Export Data
								</Button>
								<Button
									className="w-full"
									variant="secondary"
								>
									View Analytics
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	)
}
