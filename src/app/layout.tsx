import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'react-hot-toast'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
	display: 'swap'
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
	display: 'swap'
})

export const metadata: Metadata = {
	title: 'ZestDash - Live Sales Dashboard',
	description:
		'Open source live sales dashboard built with Next.js and shadcn/ui. Track real-time sales metrics, subscriptions, and user activity.',
	keywords: [
		'sales dashboard',
		'analytics',
		'next.js',
		'shadcn/ui',
		'real-time',
		'metrics'
	],
	authors: [{ name: 'ZestDash Team' }],
	creator: 'ZestDash',
	publisher: 'ZestDash',
	formatDetection: {
		email: false,
		address: false,
		telephone: false
	},
	metadataBase: new URL('https://zestdash.vercel.app'),
	openGraph: {
		title: 'ZestDash - Live Sales Dashboard',
		description:
			'Open source live sales dashboard built with Next.js and shadcn/ui',
		type: 'website',
		locale: 'en_US'
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1
		}
	}
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5
}

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
		>
			<head>
				<meta
					name="color-scheme"
					content="dark light"
				/>
				<meta
					name="theme-color"
					media="(prefers-color-scheme: light)"
					content="#ffffff"
				/>
				<meta
					name="theme-color"
					media="(prefers-color-scheme: dark)"
					content="#09090b"
				/>
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					{children}
					<Toaster
						position="top-right"
						toastOptions={{
							duration: 4000,
							style: {
								background: 'hsl(var(--background))',
								color: 'hsl(var(--foreground))',
								border: '1px solid hsl(var(--border))'
							},
							success: {
								iconTheme: {
									primary: 'hsl(var(--primary))',
									secondary: 'hsl(var(--primary-foreground))'
								}
							},
							error: {
								iconTheme: {
									primary: 'hsl(var(--destructive))',
									secondary: 'hsl(var(--destructive-foreground))'
								}
							}
						}}
					/>
				</ThemeProvider>
			</body>
		</html>
	)
}
