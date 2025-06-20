'use client'

import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect,
	useRef,
	useMemo
} from 'react'
import toast from 'react-hot-toast'
import { useOrderTotals, formatDateForApi } from './shopify-api'

// localStorage keys
const STORAGE_KEYS = {
	ORDERS_HISTORY: 'whipdash_orders_history',
	CURRENT_SESSION: 'whipdash_current_session',
	LAST_SESSION: 'whipdash_last_session'
}

// Types for persisted data
interface PersistedOrder {
	id: string
	timestamp: string
	orderNumber?: string
	customerName?: string
	totalPrice: number
	source: 'shopify' | 'manual'
	shopifyData?: {
		id: string | number
		name: string
		created_at: string
		total_price: number
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
	}
}

interface PersistedSoldOutProduct {
	id: string | number
	title: string
	handle: string
	soldOutVariantsCount: number
	totalVariantsCount: number
	soldOutAt: string // timestamp when detected as sold out
}

interface SessionHistory {
	sessionId: string
	startTime: string
	endTime?: string
	orders: PersistedOrder[]
	totalOrders: number
	totalSales: number
	goalAmount: number
	soldOutProducts: PersistedSoldOutProduct[]
}

// localStorage utilities
const getStoredData = <T,>(key: string, defaultValue: T): T => {
	if (typeof window === 'undefined') return defaultValue
	try {
		const stored = localStorage.getItem(key)
		return stored ? JSON.parse(stored) : defaultValue
	} catch (error) {
		console.warn(`Failed to parse localStorage key "${key}":`, error)
		return defaultValue
	}
}

const setStoredData = <T,>(key: string, data: T): void => {
	if (typeof window === 'undefined') return
	try {
		// Create a deep clone to avoid circular references, especially in test environments
		const cleanData = JSON.parse(
			JSON.stringify(data, (key, value) => {
				// Filter out any potential React fiber or DOM node references
				if (value && typeof value === 'object' && value.constructor) {
					const constructorName = value.constructor.name
					if (
						constructorName.includes('Fiber') ||
						constructorName.includes('HTML') ||
						constructorName.includes('Element')
					) {
						return undefined // Skip these objects
					}
				}
				return value
			})
		)
		localStorage.setItem(key, JSON.stringify(cleanData))
	} catch (error) {
		// In test environments, localStorage failures are non-critical
		const isTestEnvironment =
			typeof process !== 'undefined' &&
			(process.env.NODE_ENV === 'test' ||
				process.env.JEST_WORKER_ID !== undefined)

		if (!isTestEnvironment) {
			console.warn(`Failed to save to localStorage key "${key}":`, error)
		}
		// Silently fail in test environments to avoid console noise
	}
}

interface SessionState {
	isStarted: boolean
	isRunning: boolean
	isEnded: boolean
	status: 'ready' | 'live' | 'paused' | 'ended'
	sessionId?: string
	startTime?: string
	duration: number // duration in seconds
}

interface SalesGoalState {
	goalAmount: number
	currentAmount: number
}

interface OrdersState {
	totalOrders: number
	lastSessionOrders: number
	currentSessionOrders: PersistedOrder[]
	lastSessionData: SessionHistory | null
	ordersHistory: SessionHistory[]
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
	currentSessionSoldOutProducts: PersistedSoldOutProduct[]
	startSession: () => void
	pauseSession: () => void
	resumeSession: () => void
	endSession: () => void
	editStartTime: (newStartTime: string) => void
	setSalesGoal: (amount: number) => void
	addSale: (amount: number) => void
	resetSales: () => void
	addOrder: (price?: number) => void
	resetOrders: () => void
	refreshShopifyData: () => void
	clearOrdersHistory: () => void
	addSoldOutProduct: (product: PersistedSoldOutProduct) => void
	resetSoldOutProducts: () => void
	showSessionModal: boolean
	openSessionModal: () => void
	closeSessionModal: () => void
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

// Helper to generate session ID
const generateSessionId = () => {
	return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function SessionProvider({ children }: { children: ReactNode }) {
	// Initialize state from localStorage
	const [sessionState, setSessionState] = useState<SessionState>(() => {
		const stored = getStoredData(STORAGE_KEYS.CURRENT_SESSION, null)
		return (
			stored || {
				isStarted: false,
				isRunning: false,
				isEnded: false,
				status: 'ready' as const,
				duration: 0
			}
		)
	})

	// Session modal state
	const [showSessionModal, setShowSessionModal] = useState(false)

	// Sold out products tracking
	const [currentSessionSoldOutProducts, setCurrentSessionSoldOutProducts] =
		useState<PersistedSoldOutProduct[]>([])

	// Duration timer ref
	const durationTimerRef = useRef<NodeJS.Timeout | null>(null)

	const [salesGoalState, setSalesGoalState] = useState<SalesGoalState>(() => {
		const lastSessionData = getStoredData<SessionHistory | null>(
			STORAGE_KEYS.LAST_SESSION,
			null
		)

		return {
			goalAmount: lastSessionData?.goalAmount || 250,
			currentAmount: lastSessionData?.totalSales || 0
		}
	})

	const [ordersState, setOrdersState] = useState<OrdersState>(() => {
		const ordersHistory = getStoredData<SessionHistory[]>(
			STORAGE_KEYS.ORDERS_HISTORY,
			[]
		)
		const lastSessionData = getStoredData<SessionHistory | null>(
			STORAGE_KEYS.LAST_SESSION,
			null
		)

		// Ensure soldOutProducts exists in legacy data
		const normalizedLastSession = lastSessionData
			? {
					...lastSessionData,
					soldOutProducts: lastSessionData.soldOutProducts || []
			  }
			: null

		const normalizedHistory = ordersHistory.map((session) => ({
			...session,
			soldOutProducts: session.soldOutProducts || []
		}))

		return {
			totalOrders: normalizedLastSession?.totalOrders || 0,
			lastSessionOrders: normalizedLastSession?.totalOrders || 0,
			currentSessionOrders: normalizedLastSession?.orders || [],
			lastSessionData: normalizedLastSession,
			ordersHistory: normalizedHistory
		}
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

	// Calculate date range based on session state
	const dateRange = useMemo(() => {
		if (sessionState.isStarted && sessionState.startTime) {
			// When session is active, fetch orders from session start date to allow filtering
			const sessionDate = new Date(sessionState.startTime)
			return {
				start: formatDateForApi(sessionDate),
				end: undefined // Don't set end to include all orders from session start onwards
			}
		} else {
			// When no session is active, use last 7 days for dashboard viewing
			return getLast7DaysDateRange()
		}
	}, [sessionState.isStarted, sessionState.startTime])

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

	// Track last update time for Shopify data
	const [shopifyLastUpdate, setShopifyLastUpdate] = useState<Date | null>(null)

	// Update last update time when Shopify data changes
	useEffect(() => {
		if (shopifyOrderData && !shopifyError) {
			setShopifyLastUpdate(new Date())
		}
	}, [shopifyOrderData, shopifyError])

	// Filter orders to only include those from the current session
	const sessionFilteredOrders = useMemo(() => {
		if (
			!shopifyOrderData?.orders ||
			!sessionState.isStarted ||
			!sessionState.startTime
		) {
			return shopifyOrderData?.orders || []
		}

		const sessionStartTime = new Date(sessionState.startTime)
		return shopifyOrderData.orders.filter((order) => {
			const orderCreatedTime = new Date(order.created_at)
			return orderCreatedTime >= sessionStartTime
		})
	}, [shopifyOrderData?.orders, sessionState.isStarted, sessionState.startTime])

	// Calculate session-specific totals
	const sessionTotals = useMemo(() => {
		if (!sessionState.isStarted || sessionFilteredOrders.length === 0) {
			return {
				orderCount: 0,
				totalSales: 0
			}
		}

		const totalSales = sessionFilteredOrders.reduce(
			(sum, order) => sum + order.total_price,
			0
		)
		return {
			orderCount: sessionFilteredOrders.length,
			totalSales
		}
	}, [sessionFilteredOrders, sessionState.isStarted])

	// Derived shopify data state - use session-filtered data when session is active
	const shopifyData = {
		orderCount: sessionState.isStarted
			? sessionTotals.orderCount
			: shopifyOrderData?.summary?.orderCount || 0,
		totalSales: sessionState.isStarted
			? sessionTotals.totalSales
			: shopifyOrderData?.summary?.finalTotalPrice || 0,
		orders: sessionState.isStarted
			? sessionFilteredOrders
			: shopifyOrderData?.orders || [],
		loading: shopifyLoading,
		error: shopifyError,
		lastUpdated: shopifyLastUpdate
	}

	// Persist current session to localStorage
	useEffect(() => {
		if (sessionState.isStarted) {
			setStoredData(STORAGE_KEYS.CURRENT_SESSION, sessionState)
		} else {
			// Clear current session when not active
			if (typeof window !== 'undefined') {
				localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION)
			}
		}
	}, [sessionState])

	// Toast notification for new orders
	useEffect(() => {
		if (sessionState.isStarted && sessionState.isRunning) {
			const currentOrderCount = sessionTotals.orderCount

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
	}, [sessionTotals.orderCount, sessionState.isStarted, sessionState.isRunning])

	// Detect new Shopify orders and persist them
	useEffect(() => {
		if (
			sessionState.isStarted &&
			sessionState.sessionId &&
			sessionFilteredOrders.length > 0
		) {
			const newShopifyOrders = sessionFilteredOrders.filter((order) => {
				// Check if order is not already in current session
				return !ordersState.currentSessionOrders.some(
					(persistedOrder) => persistedOrder.id === order.id.toString()
				)
			})

			if (newShopifyOrders.length > 0) {
				const persistedOrders: PersistedOrder[] = newShopifyOrders.map(
					(order) => ({
						id: order.id.toString(),
						timestamp: new Date().toISOString(),
						orderNumber: order.name,
						customerName: order.customer
							? `${order.customer.first_name} ${order.customer.last_name}`.trim()
							: 'Guest Customer',
						totalPrice: order.total_price,
						source: 'shopify' as const,
						shopifyData: order
					})
				)

				setOrdersState((prev) => ({
					...prev,
					currentSessionOrders: [
						...prev.currentSessionOrders,
						...persistedOrders
					],
					totalOrders: prev.totalOrders + persistedOrders.length
				}))
			}
		}
	}, [
		sessionFilteredOrders,
		sessionState.isStarted,
		sessionState.sessionId,
		ordersState.currentSessionOrders
	])

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

	// Update local orders state when session totals change
	useEffect(() => {
		if (sessionState.isStarted) {
			setOrdersState((prev) => ({
				...prev,
				totalOrders: Math.max(
					sessionTotals.orderCount,
					prev.currentSessionOrders.length
				)
			}))
		}
	}, [sessionTotals.orderCount, sessionState.isStarted])

	// Update sales goal current amount from session totals
	useEffect(() => {
		if (sessionState.isStarted) {
			setSalesGoalState((prev) => ({
				...prev,
				currentAmount: sessionTotals.totalSales
			}))
		}
	}, [sessionTotals.totalSales, sessionState.isStarted])

	// Duration tracking effect
	useEffect(() => {
		if (sessionState.isStarted && sessionState.isRunning) {
			durationTimerRef.current = setInterval(() => {
				setSessionState((prev) => ({
					...prev,
					duration: prev.duration + 1
				}))
			}, 1000)
		} else {
			if (durationTimerRef.current) {
				clearInterval(durationTimerRef.current)
				durationTimerRef.current = null
			}
		}

		return () => {
			if (durationTimerRef.current) {
				clearInterval(durationTimerRef.current)
			}
		}
	}, [sessionState.isStarted, sessionState.isRunning])

	const startSession = () => {
		const sessionId = generateSessionId()
		const startTime = new Date().toISOString()

		setSessionState({
			isStarted: true,
			isRunning: true,
			isEnded: false,
			status: 'live',
			sessionId,
			startTime,
			duration: 0
		})

		// Reset orders state for new session
		setOrdersState((prev) => ({
			...prev,
			totalOrders: 0,
			currentSessionOrders: []
		}))

		// Reset sales goal current amount for new session
		setSalesGoalState((prev) => ({
			...prev,
			currentAmount: 0
		}))

		// Reset sold out products for new session
		setCurrentSessionSoldOutProducts([])

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

		// Create session history record
		if (sessionState.sessionId && sessionState.startTime) {
			const sessionHistory: SessionHistory = {
				sessionId: sessionState.sessionId,
				startTime: sessionState.startTime,
				endTime: new Date().toISOString(),
				orders: ordersState.currentSessionOrders,
				totalOrders: finalOrders,
				totalSales: finalSales,
				goalAmount: salesGoalState.goalAmount,
				soldOutProducts: currentSessionSoldOutProducts
			}

			// Update orders history
			const updatedHistory = [...ordersState.ordersHistory, sessionHistory]
			setStoredData(STORAGE_KEYS.ORDERS_HISTORY, updatedHistory)
			setStoredData(STORAGE_KEYS.LAST_SESSION, sessionHistory)

			// Update state - but keep current data for display
			setOrdersState((prev) => ({
				...prev,
				lastSessionOrders: finalOrders,
				// Don't reset totalOrders and currentSessionOrders yet
				lastSessionData: sessionHistory,
				ordersHistory: updatedHistory
			}))
		}

		// Only update session state to mark as ended
		setSessionState((prev) => ({
			...prev,
			isStarted: false,
			isRunning: false,
			isEnded: true,
			status: 'ended'
		}))

		// Don't reset sales goal current amount yet - let it show the final amount

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

	const editStartTime = (newStartTime: string) => {
		if (!sessionState.isStarted || !sessionState.sessionId) {
			toast.error('No active session to edit')
			return
		}

		// Validate the new start time
		const newStartDate = new Date(newStartTime)
		const now = new Date()

		if (newStartDate > now) {
			toast.error('Start time cannot be in the future')
			return
		}

		// Update the session state with new start time
		setSessionState((prev) => ({
			...prev,
			startTime: newStartTime
		}))

		// Save to localStorage
		setStoredData(STORAGE_KEYS.CURRENT_SESSION, {
			...sessionState,
			startTime: newStartTime
		})

		toast.success('Session start time updated', {
			id: 'start-time-updated',
			duration: 2000
		})
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

	const addOrder = (price?: number) => {
		if (sessionState.sessionId) {
			// Use provided price or generate random price
			const orderPrice = price || Math.floor(Math.random() * 191) + 10 // Random price between $10-$200

			// Generate sample line items for test order
			const sampleProducts = [
				'Organic Cotton T-Shirt',
				'Wireless Headphones',
				'Coffee Mug',
				'Laptop Sleeve',
				'Notebook Set',
				'Phone Case',
				'Water Bottle',
				'Desk Organizer',
				'Bluetooth Speaker',
				'Travel Backpack'
			]

			// Generate 1-3 random line items
			const numItems = Math.floor(Math.random() * 3) + 1
			const lineItems = []
			let remainingPrice = orderPrice

			for (let i = 0; i < numItems; i++) {
				const productName =
					sampleProducts[Math.floor(Math.random() * sampleProducts.length)]
				const quantity = Math.floor(Math.random() * 2) + 1 // 1-2 items

				// For the last item, use remaining price, otherwise distribute randomly
				const itemPrice =
					i === numItems - 1
						? remainingPrice / quantity
						: Math.floor(Math.random() * (remainingPrice / numItems)) / quantity

				lineItems.push({
					id: `item_${Date.now()}_${i}`,
					title: productName,
					price: itemPrice,
					quantity: quantity,
					total_discount: 0
				})

				remainingPrice -= itemPrice * quantity
			}

			// Create a manual order entry with line items
			const manualOrder: PersistedOrder = {
				id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date().toISOString(),
				orderNumber: `#TEST-${Date.now()}`,
				customerName: 'Test Customer',
				totalPrice: orderPrice,
				source: 'manual',
				shopifyData: {
					id: `test_${Date.now()}`,
					name: `#TEST-${Date.now()}`,
					created_at: new Date().toISOString(),
					total_price: orderPrice,
					customer: {
						id: 'test_customer',
						first_name: 'Test',
						last_name: 'Customer',
						email: 'test@example.com'
					},
					line_items: lineItems
				}
			}

			setOrdersState((prev) => ({
				...prev,
				totalOrders: prev.totalOrders + 1,
				currentSessionOrders: [...prev.currentSessionOrders, manualOrder]
			}))
		} else {
			// Fallback for when no session is active
			setOrdersState((prev) => ({
				...prev,
				totalOrders: prev.totalOrders + 1
			}))
		}
	}

	const resetOrders = () => {
		setOrdersState((prev) => ({
			...prev,
			totalOrders: 0,
			currentSessionOrders: []
		}))
	}

	const refreshShopifyData = () => {
		toast.loading('🔄 Refreshing sales data...', {
			id: 'refresh-data',
			duration: 2000
		})
		refetchShopifyData()
	}

	const clearOrdersHistory = () => {
		setOrdersState((prev) => ({
			...prev,
			ordersHistory: [],
			lastSessionData: null,
			lastSessionOrders: 0
		}))

		// Clear from localStorage
		if (typeof window !== 'undefined') {
			localStorage.removeItem(STORAGE_KEYS.ORDERS_HISTORY)
			localStorage.removeItem(STORAGE_KEYS.LAST_SESSION)
		}

		toast.success('🗑️ Orders history cleared', {
			id: 'history-cleared',
			duration: 3000
		})
	}

	const addSoldOutProduct = (product: PersistedSoldOutProduct) => {
		setCurrentSessionSoldOutProducts((prev) => {
			// Check if product already exists (by id) to avoid duplicates
			const exists = prev.some((p) => p.id === product.id)
			if (exists) {
				// Update existing product
				return prev.map((p) => (p.id === product.id ? product : p))
			} else {
				// Add new product
				return [...prev, product]
			}
		})
	}

	const resetSoldOutProducts = () => {
		setCurrentSessionSoldOutProducts([])
	}

	const openSessionModal = () => {
		setShowSessionModal(true)
	}

	const closeSessionModal = () => {
		setShowSessionModal(false)
	}

	return (
		<SessionContext.Provider
			value={{
				sessionState,
				salesGoalState,
				ordersState,
				shopifyData,
				currentSessionSoldOutProducts,
				startSession,
				pauseSession,
				resumeSession,
				endSession,
				editStartTime,
				setSalesGoal,
				addSale,
				resetSales,
				addOrder,
				resetOrders,
				refreshShopifyData,
				clearOrdersHistory,
				addSoldOutProduct,
				resetSoldOutProducts,
				showSessionModal,
				openSessionModal,
				closeSessionModal
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
