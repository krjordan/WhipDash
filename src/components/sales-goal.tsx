'use client'

import * as React from 'react'
import { DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/lib/session-context'
import { ConfettiCelebration } from '@/components/confetti-celebration'

export function SalesGoal() {
	const { sessionState, salesGoalState, shopifyData } = useSession()
	const [showConfetti, setShowConfetti] = React.useState(false)
	const [hasReachedSalesGoal, setHasReachedSalesGoal] = React.useState(false)

	// Check for sales goal completion and trigger confetti
	React.useEffect(() => {
		if (
			sessionState.isStarted &&
			sessionState.isRunning &&
			salesGoalState.currentAmount >= salesGoalState.goalAmount &&
			!hasReachedSalesGoal
		) {
			setHasReachedSalesGoal(true)
			setShowConfetti(true)
		}
	}, [
		salesGoalState.currentAmount,
		salesGoalState.goalAmount,
		sessionState.isStarted,
		sessionState.isRunning,
		hasReachedSalesGoal
	])

	// Reset goal tracking when session starts/ends or goal changes
	React.useEffect(() => {
		if (
			!sessionState.isStarted ||
			salesGoalState.currentAmount < salesGoalState.goalAmount
		) {
			setHasReachedSalesGoal(false)
			setShowConfetti(false)
		}
	}, [
		sessionState.isStarted,
		salesGoalState.currentAmount,
		salesGoalState.goalAmount
	])

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount)
	}

	const getProgressColor = (current: number, goal: number) => {
		const progressPercentage = (current / goal) * 100

		if (progressPercentage >= 100) return 'bg-green-500' // 100%+: green (goal achieved!)
		if (progressPercentage >= 80) return 'bg-lime-500' // 80-100%: lime (very close)
		if (progressPercentage >= 60) return 'bg-yellow-500' // 60-80%: yellow (good progress)
		if (progressPercentage >= 30) return 'bg-orange-500' // 30-60%: orange (making progress)
		return 'bg-red-500' // 0-30%: red (far from goal)
	}

	const getProgressWidth = (current: number, goal: number) => {
		const percentage = Math.min((current / goal) * 100, 100)
		return percentage
	}

	const getProgressPercentage = (current: number, goal: number) => {
		const percentage = (current / goal) * 100
		return Math.floor(percentage * 10) / 10 // One decimal place for precision
	}

	const getRemainingAmount = (current: number, goal: number) => {
		return Math.max(goal - current, 0)
	}

	const handleConfettiComplete = () => {
		setShowConfetti(false)
	}

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Sales Goal</CardTitle>
					<DollarSign className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						{formatCurrency(salesGoalState.currentAmount)}
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						{getProgressPercentage(
							salesGoalState.currentAmount,
							salesGoalState.goalAmount
						)}
						% of goal (
						{formatCurrency(
							getRemainingAmount(
								salesGoalState.currentAmount,
								salesGoalState.goalAmount
							)
						)}{' '}
						remaining)
					</p>

					{/* Goal Info */}
					{sessionState.isStarted && (
						<div className="mt-3 mb-2 space-y-2">
							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								<DollarSign className="h-3 w-3" />
								<span>Goal: {formatCurrency(salesGoalState.goalAmount)}</span>
							</div>
						</div>
					)}

					{/* Progress bar */}
					{sessionState.isStarted && (
						<div className="mt-2">
							<div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
								<span>$0</span>
								<span>{formatCurrency(salesGoalState.goalAmount)}</span>
							</div>
							<div className="w-full bg-muted rounded-full h-2">
								<div
									role="progressbar"
									aria-valuenow={getProgressPercentage(
										salesGoalState.currentAmount,
										salesGoalState.goalAmount
									)}
									aria-valuemin={0}
									aria-valuemax={100}
									aria-label="Sales progress"
									className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(
										salesGoalState.currentAmount,
										salesGoalState.goalAmount
									)}`}
									style={{
										width: `${getProgressWidth(
											salesGoalState.currentAmount,
											salesGoalState.goalAmount
										)}%`
									}}
								/>
							</div>
						</div>
					)}

					{/* Status indicator */}
					<div className="flex items-center gap-2 mt-3">
						<div
							className={`h-2 w-2 rounded-full ${
								!sessionState.isStarted
									? 'bg-gray-400'
									: shopifyData.error
									? 'bg-red-500'
									: shopifyData.loading
									? 'bg-orange-500 animate-pulse'
									: salesGoalState.currentAmount >= salesGoalState.goalAmount
									? 'bg-green-500 animate-pulse'
									: sessionState.isRunning
									? 'bg-blue-500'
									: 'bg-yellow-500'
							}`}
						/>
						<span className="text-xs text-muted-foreground">
							{!sessionState.isStarted
								? 'Waiting for Session'
								: shopifyData.error
								? 'Shopify Connection Error'
								: shopifyData.loading && sessionState.isRunning
								? 'Loading Sales Data...'
								: salesGoalState.currentAmount >= salesGoalState.goalAmount
								? 'Goal Achieved!'
								: sessionState.isRunning
								? shopifyData.lastUpdated
									? 'Live Shopify Data'
									: 'Tracking Sales'
								: 'Session Paused'}
						</span>
					</div>

					{/* Shopify data indicator - only show if we have valid Shopify data */}
					{sessionState.isStarted &&
						shopifyData.lastUpdated &&
						!shopifyData.error && (
							<div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
								<div className="h-1 w-1 rounded-full bg-green-500" />
								<span>
									Last updated: {shopifyData.lastUpdated.toLocaleTimeString()}
								</span>
							</div>
						)}

					{/* Error message */}
					{sessionState.isStarted && shopifyData.error && (
						<div className="mt-2 p-2 rounded bg-red-50 border border-red-200">
							<p className="text-xs text-red-600">{shopifyData.error}</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Confetti celebration for sales goal achievement */}
			<ConfettiCelebration
				isActive={showConfetti}
				onComplete={handleConfettiComplete}
				duration={4000}
				numberOfPieces={250}
			/>
		</>
	)
}
