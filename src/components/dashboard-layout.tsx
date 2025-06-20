'use client'

import * as React from 'react'
import { BarChart3, PanelLeft, History } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { LiveStatusBadge } from '@/components/live-status-badge'
import { SessionProvider } from '@/lib/session-context'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface DashboardLayoutProps {
	children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
	const [sidebarOpen, setSidebarOpen] = React.useState(true)
	const pathname = usePathname()

	return (
		<SessionProvider>
			<div className="flex h-screen w-full overflow-hidden">
				<div
					className={`${
						sidebarOpen ? 'w-64' : 'w-16'
					} shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200`}
				>
					<div className="border-b border-sidebar-border">
						<div
							className={`${
								sidebarOpen ? 'p-4' : 'p-2'
							} transition-all duration-200`}
						>
							{sidebarOpen ? (
								<>
									<h1 className="text-xl font-bold text-sidebar-foreground">
										WhipDash
									</h1>
									<p className="text-sm text-sidebar-foreground/70">
										Live Sales Dashboard
									</p>
								</>
							) : (
								<div className="flex justify-center">
									<div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center">
										<span className="text-sidebar-accent-foreground font-bold text-sm">
											W
										</span>
									</div>
								</div>
							)}
						</div>
					</div>
					<div className="flex-1 overflow-auto">
						<div className="p-2">
							<div className="flex flex-col gap-1">
								<Link
									href="/"
									className={`flex items-center rounded-md p-2 font-medium transition-all duration-200 ${
										pathname === '/'
											? 'bg-sidebar-accent text-sidebar-accent-foreground'
											: 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
									} ${sidebarOpen ? 'gap-2' : 'justify-center'}`}
									title={!sidebarOpen ? 'Live Dashboard' : undefined}
								>
									<BarChart3 className="h-4 w-4 shrink-0" />
									{sidebarOpen && <span>Live Dashboard</span>}
								</Link>
								<Link
									href="/session-history"
									className={`flex items-center rounded-md p-2 font-medium transition-all duration-200 ${
										pathname === '/session-history'
											? 'bg-sidebar-accent text-sidebar-accent-foreground'
											: 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
									} ${sidebarOpen ? 'gap-2' : 'justify-center'}`}
									title={!sidebarOpen ? 'Session History' : undefined}
								>
									<History className="h-4 w-4 shrink-0" />
									{sidebarOpen && <span>Session History</span>}
								</Link>
							</div>
						</div>
					</div>
				</div>

				<div className="flex-1 flex flex-col min-w-0 bg-background">
					{/* Skip to main content link for keyboard navigation */}
					<a
						href="#main-content"
						className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-3 py-2 rounded-md z-50"
					>
						Skip to main content
					</a>

					{/* Header with sidebar trigger */}
					<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setSidebarOpen(!sidebarOpen)}
							className="h-7 w-7 -ml-1"
						>
							<PanelLeft className="h-4 w-4" />
							<span className="sr-only">Toggle Sidebar</span>
						</Button>
						<div className="flex-1 text-center">
							<h2 className="text-lg font-semibold">
								{pathname === '/session-history'
									? 'Session History'
									: 'Live Dashboard'}
							</h2>
						</div>
						<div className="flex items-center gap-4">
							<LiveStatusBadge />
							<ThemeToggle />
						</div>
					</header>

					{/* Main Content */}
					{children}
				</div>
			</div>
		</SessionProvider>
	)
}
