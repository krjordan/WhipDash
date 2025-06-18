'use client'

import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect,
	useRef
} from 'react'
import toast from 'react-hot-toast'
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
		orders: Array<{
			id: string | number
			name: string
			created_at: string
			subtotal_price: number
			total_tax: number
			total_shipping: number
			total_price: number
			current_subtotal_price: number
			total_discounts: number
			financial_status: string
			fulfillment_status: string
			customer?: {
				id: string | number
				first_name: string
				last_name: string
				email: string
			}
			line_items: Array<{
				id: string | number
				title: string
				price: number
				quantity: number
				total_discount: number
			}>
		}>
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

	// Refs to track previous values for notifications
	const previousOrderCount = useRef<number>(0)
	const previousSalesAmount = useRef<number>(0)
	const hasReachedGoal = useRef<boolean>(false)
	const previousError = useRef<string | null>(null)

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
		orders: shopifyOrderData?.orders || [], // Include the actual order breakdown data
		loading: shopifyLoading,
		error: shopifyError,
		lastUpdated: shopifyOrderData ? new Date() : null
	}

	// Toast notification for new orders
	useEffect(() => {
		if (shopifyOrderData && sessionState.isStarted && sessionState.isRunning) {
			const currentOrderCount = shopifyOrderData.summary.orderCount

			// Only notify if order count increased and we have a previous count
			if (
				currentOrderCount > previousOrderCount.current &&
				previousOrderCount.current > 0
			) {
				const newOrders = currentOrderCount - previousOrderCount.current
				toast.success(
					`🛒 ${
						newOrders === 1
							? 'New order received!'
							: `${newOrders} new orders received!`
					}`,
					{
						id: `new-orders-${currentOrderCount}`, // Prevent duplicates
						duration: 5000
					}
				)
			}

			previousOrderCount.current = currentOrderCount
		}
	}, [shopifyOrderData, sessionState.isStarted, sessionState.isRunning])

	// Toast notification for sales goal achievement
	useEffect(() => {
		if (sessionState.isStarted && sessionState.isRunning) {
			const currentAmount = salesGoalState.currentAmount
			const goalAmount = salesGoalState.goalAmount

			// Check if goal was just reached
			if (
				currentAmount >= goalAmount &&
				!hasReachedGoal.current &&
				previousSalesAmount.current < goalAmount
			) {
				hasReachedGoal.current = true
				toast.success(
					`🎉 Sales goal reached! $${currentAmount.toFixed(
						2
					)} / $${goalAmount.toFixed(2)}`,
					{
						id: 'goal-reached',
						duration: 6000
					}
				)
			}

			// Reset goal tracking if amount goes below goal (e.g., refunds)
			if (currentAmount < goalAmount) {
				hasReachedGoal.current = false
			}

			previousSalesAmount.current = currentAmount
		}
	}, [
		salesGoalState.currentAmount,
		salesGoalState.goalAmount,
		sessionState.isStarted,
		sessionState.isRunning
	])

	// Toast notification for errors
	useEffect(() => {
		if (
			shopifyError &&
			shopifyError !== previousError.current &&
			sessionState.isStarted
		) {
			toast.error(`⚠️ Shopify connection error: ${shopifyError}`, {
				id: 'shopify-error',
				duration: 8000
			})
		}

		// Clear error toast when error is resolved
		if (!shopifyError && previousError.current) {
			toast.dismiss('shopify-error')
			toast.success('✅ Shopify connection restored', {
				id: 'shopify-restored',
				duration: 3000
			})
		}

		previousError.current = shopifyError
	}, [shopifyError, sessionState.isStarted])

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

		// Reset tracking refs when starting a new session
		previousOrderCount.current = 0
		previousSalesAmount.current = 0
		hasReachedGoal.current = false

		toast.success('🚀 Sales session started!', {
			id: 'session-started',
			duration: 3000
		})
	}

	const pauseSession = () => {
		setSessionState((prev) => ({
			...prev,
			isRunning: false,
			status: 'paused'
		}))

		toast('⏸️ Session paused', {
			id: 'session-paused',
			duration: 2000
		})
	}

	const resumeSession = () => {
		setSessionState((prev) => ({
			...prev,
			isRunning: true,
			status: 'live'
		}))

		toast.success('▶️ Session resumed', {
			id: 'session-resumed',
			duration: 2000
		})
	}

	const endSession = () => {
		const finalOrders = ordersState.totalOrders
		const finalSales = salesGoalState.currentAmount

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

		// Reset tracking refs
		previousOrderCount.current = 0
		previousSalesAmount.current = 0
		hasReachedGoal.current = false

		toast.success(
			`🏁 Session ended! ${finalOrders} orders, $${finalSales.toFixed(
				2
			)} in sales`,
			{
				id: 'session-ended',
				duration: 5000
			}
		)
	}

	const setSalesGoal = (amount: number) => {
		setSalesGoalState((prev) => ({
			...prev,
			goalAmount: amount
		}))

		toast(`🎯 Sales goal set to $${amount.toFixed(2)}`, {
			id: 'goal-set',
			duration: 2000
		})
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
		toast.loading('🔄 Refreshing sales data...', {
			id: 'refresh-data',
			duration: 2000
		})
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
