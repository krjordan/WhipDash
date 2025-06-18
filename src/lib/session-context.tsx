'use client'

import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect
} from 'react'
import { useOrderTotals, formatDateForApi } from './shopify-api'

interface SessionState {
	isStarted: boolean
	isRunning: boolean
	isEnded: boolean
	status: 'ready' | 'live' | 'paused' | 'ended'
}

interface SalesGoalState {
	goalAmount: number
	currentAmount: number
}

interface OrdersState {
	totalOrders: number
	lastSessionOrders: number
}

interface SessionContextType {
	sessionState: SessionState
	salesGoalState: SalesGoalState
	ordersState: OrdersState
	shopifyData: {
		orderCount: number
		totalSales: number
		loading: boolean
		error: string | null
		lastUpdated: Date | null
	}
	startSession: () => void
	pauseSession: () => void
	resumeSession: () => void
	endSession: () => void
	setSalesGoal: (amount: number) => void
	addSale: (amount: number) => void
	resetSales: () => void
	addOrder: () => void
	resetOrders: () => void
	refreshShopifyData: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

// Helper to get last 7 days date range
function getLast7DaysDateRange() {
	const today = new Date()
	const sevenDaysAgo = new Date(today)
	sevenDaysAgo.setDate(today.getDate() - 7)

	return {
		start: formatDateForApi(sevenDaysAgo),
		end: formatDateForApi(today)
	}
}

export function SessionProvider({ children }: { children: ReactNode }) {
	const [sessionState, setSessionState] = useState<SessionState>({
		isStarted: false,
		isRunning: false,
		isEnded: false,
		status: 'ready'
	})

	const [salesGoalState, setSalesGoalState] = useState<SalesGoalState>({
		goalAmount: 250,
		currentAmount: 0
	})

	const [ordersState, setOrdersState] = useState<OrdersState>({
		totalOrders: 0,
		lastSessionOrders: 0
	})

	// Shopify API integration - only fetch when session is active and not in test environment
	const isTestEnvironment =
		typeof process !== 'undefined' &&
		(process.env.NODE_ENV === 'test' ||
			process.env.JEST_WORKER_ID !== undefined)

	// Get last 7 days date range for more comprehensive testing
	const dateRange = getLast7DaysDateRange()

	const {
		data: shopifyOrderData,
		loading: shopifyLoading,
		error: shopifyError,
		refetch: refetchShopifyData
	} = useOrderTotals({
		created_at_min: dateRange.start,
		created_at_max: dateRange.end,
		refreshInterval:
			sessionState.isRunning && !isTestEnvironment ? 30000 : undefined, // 30 seconds when live
		enabled: sessionState.isStarted && !isTestEnvironment
	})

	// Derived shopify data state
	const shopifyData = {
		orderCount: shopifyOrderData?.summary?.orderCount || 0,
		totalSales: shopifyOrderData?.summary?.finalTotalPrice || 0,
		loading: shopifyLoading,
		error: shopifyError,
		lastUpdated: shopifyOrderData ? new Date() : null
	}

	// Update local orders state when Shopify data changes
	useEffect(() => {
		if (shopifyOrderData && sessionState.isStarted) {
			setOrdersState((prev) => ({
				...prev,
				totalOrders: shopifyOrderData.summary.orderCount
			}))
		}
	}, [shopifyOrderData, sessionState.isStarted])

	// Update sales goal current amount from Shopify data
	useEffect(() => {
		if (shopifyOrderData && sessionState.isStarted) {
			setSalesGoalState((prev) => ({
				...prev,
				currentAmount: shopifyOrderData.summary.finalTotalPrice
			}))
		}
	}, [shopifyOrderData, sessionState.isStarted])

	const startSession = () => {
		setSessionState({
			isStarted: true,
			isRunning: true,
			isEnded: false,
			status: 'live'
		})
	}

	const pauseSession = () => {
		setSessionState((prev) => ({
			...prev,
			isRunning: false,
			status: 'paused'
		}))
	}

	const resumeSession = () => {
		setSessionState((prev) => ({
			...prev,
			isRunning: true,
			status: 'live'
		}))
	}

	const endSession = () => {
		setOrdersState((prev) => ({
			lastSessionOrders: prev.totalOrders,
			totalOrders: 0
		}))

		setSessionState({
			isStarted: false,
			isRunning: false,
			isEnded: true,
			status: 'ended'
		})
		setSalesGoalState((prev) => ({
			...prev,
			currentAmount: 0
		}))
	}

	const setSalesGoal = (amount: number) => {
		setSalesGoalState((prev) => ({
			...prev,
			goalAmount: amount
		}))
	}

	const addSale = (amount: number) => {
		setSalesGoalState((prev) => ({
			...prev,
			currentAmount: prev.currentAmount + amount
		}))
	}

	const resetSales = () => {
		setSalesGoalState((prev) => ({
			...prev,
			currentAmount: 0
		}))
	}

	const addOrder = () => {
		setOrdersState((prev) => ({
			...prev,
			totalOrders: prev.totalOrders + 1
		}))
	}

	const resetOrders = () => {
		setOrdersState((prev) => ({
			...prev,
			totalOrders: 0
		}))
	}

	const refreshShopifyData = () => {
		refetchShopifyData()
	}

	return (
		<SessionContext.Provider
			value={{
				sessionState,
				salesGoalState,
				ordersState,
				shopifyData,
				startSession,
				pauseSession,
				resumeSession,
				endSession,
				setSalesGoal,
				addSale,
				resetSales,
				addOrder,
				resetOrders,
				refreshShopifyData
			}}
		>
			{children}
		</SessionContext.Provider>
	)
}

export function useSession() {
	const context = useContext(SessionContext)
	if (context === undefined) {
		throw new Error('useSession must be used within a SessionProvider')
	}
	return context
}
