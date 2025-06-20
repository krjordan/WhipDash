import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SessionProvider } from '../../lib/session-context'

// Mock the dashboard-layout component since it's not the focus of these tests
jest.mock('../../components/dashboard-layout', () => {
	return {
		DashboardLayout: function MockDashboardLayout({
			children
		}: {
			children: React.ReactNode
		}) {
			return (
				<div data-testid="dashboard-layout">
					<h1 data-testid="page-title">Session History</h1>
					{children}
				</div>
			)
		}
	}
})

// Mock lucide-react icons to avoid import issues
jest.mock('lucide-react', () => ({
	History: () => <div data-testid="history-icon" />,
	Calendar: () => <div data-testid="calendar-icon" />,
	ShoppingCart: () => <div data-testid="shopping-cart-icon" />,
	DollarSign: () => <div data-testid="dollar-sign-icon" />,
	Target: () => <div data-testid="target-icon" />,
	Trash2: () => <div data-testid="trash-icon" />,
	PackageX: () => <div data-testid="package-x-icon" />,
	TrendingUp: () => <div data-testid="trending-up-icon" />,
	TrendingDown: () => <div data-testid="trending-down-icon" />,
	Clock: () => <div data-testid="clock-icon" />,
	BarChart3: () => <div data-testid="bar-chart-icon" />
}))

// Import after mocks
import SessionHistoryPage from '../session-history/page'

// Helper to render component with session provider
const renderWithProvider = () => {
	return render(
		<SessionProvider>
			<SessionHistoryPage />
		</SessionProvider>
	)
}

describe('Session History Page', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		Object.defineProperty(window, 'localStorage', {
			value: {
				getItem: jest.fn(() => null),
				setItem: jest.fn(),
				removeItem: jest.fn(),
				clear: jest.fn()
			},
			writable: true
		})
	})

	it('renders the page with correct title', () => {
		renderWithProvider()

		expect(screen.getByTestId('page-title')).toHaveTextContent(
			'Session History'
		)
		expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument()
	})

	it('displays empty state when no session history exists', () => {
		renderWithProvider()

		expect(screen.getByText('No session history yet')).toBeInTheDocument()
		expect(
			screen.getByText(
				'Start a new session on the dashboard to begin tracking your sales data and performance metrics.'
			)
		).toBeInTheDocument()
		expect(screen.getByText('Go to Dashboard')).toBeInTheDocument()
	})

	it('displays only empty state when no history exists', () => {
		renderWithProvider()

		// Should show empty state
		expect(screen.getByText('No session history yet')).toBeInTheDocument()
		expect(
			screen.getByText(
				'Start a new session on the dashboard to begin tracking your sales data and performance metrics.'
			)
		).toBeInTheDocument()
		expect(screen.getByText('Go to Dashboard')).toBeInTheDocument()

		// Should NOT show summary cards when there's no data
		expect(screen.queryByText('Total Sessions')).not.toBeInTheDocument()
		expect(screen.queryByText('Total Revenue')).not.toBeInTheDocument()
		expect(screen.queryByText('Total Orders')).not.toBeInTheDocument()
		expect(screen.queryByText('Best Session')).not.toBeInTheDocument()
	})

	it('renders with mock session data', () => {
		// Mock localStorage with session history data
		const mockSessionHistory = [
			{
				sessionId: 'session_1',
				startTime: '2024-01-01T10:00:00.000Z',
				endTime: '2024-01-01T12:00:00.000Z',
				orders: [
					{
						id: 'order_1',
						timestamp: '2024-01-01T11:00:00.000Z',
						orderNumber: '#1001',
						customerName: 'John Doe',
						totalPrice: 50.0,
						source: 'shopify' as const
					}
				],
				totalOrders: 1,
				totalSales: 50.0,
				goalAmount: 100.0,
				soldOutProducts: []
			},
			{
				sessionId: 'session_2',
				startTime: '2024-01-02T14:00:00.000Z',
				endTime: '2024-01-02T16:30:00.000Z',
				orders: [
					{
						id: 'order_2',
						timestamp: '2024-01-02T15:00:00.000Z',
						orderNumber: '#1002',
						customerName: 'Jane Smith',
						totalPrice: 75.0,
						source: 'manual' as const
					},
					{
						id: 'order_3',
						timestamp: '2024-01-02T16:00:00.000Z',
						orderNumber: '#1003',
						customerName: 'Bob Johnson',
						totalPrice: 125.0,
						source: 'shopify' as const
					}
				],
				totalOrders: 2,
				totalSales: 200.0,
				goalAmount: 150.0,
				soldOutProducts: []
			}
		]

		Object.defineProperty(window, 'localStorage', {
			value: {
				getItem: jest.fn((key) => {
					if (key === 'whipdash_orders_history') {
						return JSON.stringify(mockSessionHistory)
					}
					return null
				}),
				setItem: jest.fn(),
				removeItem: jest.fn(),
				clear: jest.fn()
			},
			writable: true
		})

		renderWithProvider()

		// Should not show empty state
		expect(screen.queryByText('No session history yet')).not.toBeInTheDocument()

		// Check summary calculations
		expect(screen.getByText('2')).toBeInTheDocument() // Total Sessions
		expect(screen.getByText('$250.00')).toBeInTheDocument() // Total Revenue (50 + 200)
		expect(screen.getByText('3')).toBeInTheDocument() // Total Orders (1 + 2)

		// Check for session entries in the history list (shows formatted dates, not "Session X")
		expect(screen.getByText('Monday, January 1, 2024')).toBeInTheDocument()
		expect(screen.getByText('Tuesday, January 2, 2024')).toBeInTheDocument()

		// Check for revenue amounts - use getAllByText since $200.00 appears in both best session card and session list
		expect(screen.getByText('$50.00')).toBeInTheDocument()
		expect(screen.getAllByText('$200.00')).toHaveLength(2)

		// Check for order counts (note: format is "X orders" not "X order", "2 orders" appears twice)
		expect(screen.getByText('1 orders')).toBeInTheDocument()
		expect(screen.getAllByText('2 orders')).toHaveLength(2)
	})

	it('displays scrollable session list', () => {
		const mockSessionHistory = Array.from({ length: 10 }, (_, i) => ({
			sessionId: `session_${i + 1}`,
			startTime: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`, // Use unique dates to avoid duplicate keys
			endTime: `2024-01-${String(i + 1).padStart(2, '0')}T12:00:00.000Z`,
			orders: [],
			totalOrders: i + 1,
			totalSales: (i + 1) * 50,
			goalAmount: 100,
			soldOutProducts: []
		}))

		Object.defineProperty(window, 'localStorage', {
			value: {
				getItem: jest.fn((key) => {
					if (key === 'whipdash_orders_history') {
						return JSON.stringify(mockSessionHistory)
					}
					return null
				}),
				setItem: jest.fn(),
				removeItem: jest.fn(),
				clear: jest.fn()
			},
			writable: true
		})

		renderWithProvider()

		// Check that the scrollable container exists
		const scrollableContainer = screen.getByTestId('session-list')
		expect(scrollableContainer).toHaveClass('h-96', 'overflow-y-auto')

		// Should show multiple sessions
		expect(screen.getByText('10')).toBeInTheDocument() // Total Sessions

		// Should show multiple sessions in the scrollable list
		const sessions = screen.getAllByText(/\d+ orders/) // Look for "X orders" text
		expect(sessions.length).toBeGreaterThan(0) // Should have at least one session displayed
	})

	it('calculates best session correctly', () => {
		const mockSessionHistory = [
			{
				sessionId: 'session_1',
				startTime: '2024-01-01T10:00:00.000Z',
				endTime: '2024-01-01T12:00:00.000Z',
				orders: [],
				totalOrders: 1,
				totalSales: 50.0,
				goalAmount: 100.0,
				soldOutProducts: []
			},
			{
				sessionId: 'session_2',
				startTime: '2024-01-02T14:00:00.000Z',
				endTime: '2024-01-02T16:30:00.000Z',
				orders: [],
				totalOrders: 3,
				totalSales: 250.0, // This should be the best session
				goalAmount: 150.0,
				soldOutProducts: []
			},
			{
				sessionId: 'session_3',
				startTime: '2024-01-03T09:00:00.000Z',
				endTime: '2024-01-03T11:00:00.000Z',
				orders: [],
				totalOrders: 2,
				totalSales: 100.0,
				goalAmount: 200.0,
				soldOutProducts: []
			}
		]

		Object.defineProperty(window, 'localStorage', {
			value: {
				getItem: jest.fn((key) => {
					if (key === 'whipdash_orders_history') {
						return JSON.stringify(mockSessionHistory)
					}
					return null
				}),
				setItem: jest.fn(),
				removeItem: jest.fn(),
				clear: jest.fn()
			},
			writable: true
		})

		renderWithProvider()

		// Best session should be session 2 with $250.00 and 3 orders
		const bestSessionCard = screen.getByText('Best Session').closest('.bg-card')
		expect(bestSessionCard).toHaveTextContent('$250.00')
		expect(bestSessionCard).toHaveTextContent('3 orders')
	})

	it('handles hydration safely', () => {
		// Test that component renders without errors on server-side
		renderWithProvider()

		// Should render basic structure even before hydration
		expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument()
		expect(screen.getByTestId('page-title')).toHaveTextContent(
			'Session History'
		)
	})
})
