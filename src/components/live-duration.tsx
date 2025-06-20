'use client'

import * as React from 'react'
import { Play, Pause, Square, Target, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import {
	Dialog,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSession } from '@/lib/session-context'
import { ConfettiCelebration } from '@/components/confetti-celebration'

const GOAL_OPTIONS = [
	{ value: '60', label: '1 min', seconds: 60 },
	{ value: '900', label: '15 min', seconds: 900 },
	{ value: '1800', label: '30 min', seconds: 1800 },
	{ value: '3600', label: '1 hour', seconds: 3600 },
	{ value: '7200', label: '2 hours', seconds: 7200 },
	{ value: '14400', label: '4 hours', seconds: 14400 }
]

export function LiveDuration() {
	const [lastSessionDuration, setLastSessionDuration] = React.useState(0)
	const [goalDuration, setGoalDuration] = React.useState(7200) // default 2 hours
	const [showConfetti, setShowConfetti] = React.useState(false)
	const [hasReachedGoal, setHasReachedGoal] = React.useState(false)
	const [mounted, setMounted] = React.useState(false)
	const [showEditStartTimeModal, setShowEditStartTimeModal] =
		React.useState(false)
	const [editStartTimeValue, setEditStartTimeValue] = React.useState('')

	const {
		sessionState,
		startSession,
		pauseSession,
		resumeSession,
		endSession,
		editStartTime,
		salesGoalState,
		setSalesGoal,
		resetSales,
		resetOrders,
		showSessionModal,
		openSessionModal,
		closeSessionModal
	} = useSession()

	React.useEffect(() => {
		setMounted(true)
	}, [])

	// Reset confetti when session changes
	React.useEffect(() => {
		if (!sessionState.isStarted) {
			setHasReachedGoal(false)
			setShowConfetti(false)
		}
	}, [sessionState.isStarted])

	// Check for goal completion and trigger confetti
	React.useEffect(() => {
		if (
			sessionState.isStarted &&
			!sessionState.isEnded &&
			sessionState.duration >= goalDuration &&
			!hasReachedGoal
		) {
			setHasReachedGoal(true)
			setShowConfetti(true)
		}
	}, [
		sessionState.duration,
		goalDuration,
		sessionState.isStarted,
		sessionState.isEnded,
		hasReachedGoal
	])

	const formatTime = (seconds: number) => {
		const hours = Math.floor(seconds / 3600)
		const minutes = Math.floor((seconds % 3600) / 60)
		const secs = seconds % 60

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
				.toString()
				.padStart(2, '0')}`
		}
		return `${minutes}:${secs.toString().padStart(2, '0')}`
	}

	const getProgressColor = (seconds: number) => {
		const progressPercentage = (seconds / goalDuration) * 100

		if (progressPercentage >= 90) return 'bg-green-500' // 90-100%: green (goal achieved!)
		if (progressPercentage >= 70) return 'bg-yellow-500' // 70-90%: yellow (getting close)
		if (progressPercentage >= 40) return 'bg-orange-500' // 40-70%: orange (making progress)
		return 'bg-red-500' // 0-40%: red (far from goal)
	}

	const getProgressWidth = (seconds: number) => {
		// Progress bar fills up over the goal duration
		const percentage = Math.min((seconds / goalDuration) * 100, 100)
		return percentage
	}

	const getProgressPercentage = (seconds: number) => {
		const percentage = Math.min((seconds / goalDuration) * 100, 100)
		return Math.floor(percentage * 10) / 10 // One decimal place for precision
	}

	const getRemainingTime = (seconds: number) => {
		const remaining = Math.max(goalDuration - seconds, 0)
		const minutes = Math.floor(remaining / 60)
		return minutes
	}

	const handleShowModal = () => {
		openSessionModal()
	}

	const handleStartSession = () => {
		closeSessionModal()
		setHasReachedGoal(false)
		setShowConfetti(false)
		resetSales()
		resetOrders()
		startSession()
	}

	const handleTogglePause = () => {
		if (!sessionState.isEnded) {
			if (sessionState.isRunning) {
				pauseSession()
			} else {
				resumeSession()
			}
		}
	}

	const handleEnd = () => {
		// Save the current duration as the last completed session
		setLastSessionDuration(sessionState.duration)
		setHasReachedGoal(false)
		setShowConfetti(false)
		endSession()
	}

	const handleConfettiComplete = () => {
		setShowConfetti(false)
	}

	const handleEditStartTime = () => {
		if (sessionState.startTime) {
			// Convert ISO string to datetime-local format
			const date = new Date(sessionState.startTime)
			const localDateTime = new Date(
				date.getTime() - date.getTimezoneOffset() * 60000
			)
				.toISOString()
				.slice(0, 16)
			setEditStartTimeValue(localDateTime)
		}
		setShowEditStartTimeModal(true)
	}

	const handleSaveStartTime = () => {
		if (editStartTimeValue) {
			// Convert datetime-local back to ISO string
			const localDate = new Date(editStartTimeValue)
			const isoString = localDate.toISOString()
			editStartTime(isoString)
			setShowEditStartTimeModal(false)
		}
	}

	const handleCancelEditStartTime = () => {
		setShowEditStartTimeModal(false)
		setEditStartTimeValue('')
	}

	// Get the display duration - either current session or last session
	const getDisplayDuration = () => {
		if (!mounted) {
			return 0 // Always return 0 during SSR to prevent hydration mismatch
		}
		if (sessionState.isStarted) {
			return sessionState.duration // Show current session duration
		} else if (lastSessionDuration > 0) {
			return lastSessionDuration // Show last completed session duration
		}
		return 0 // Default when no sessions
	}

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Live Duration</CardTitle>
					<div className="flex items-center gap-2">
						{!mounted || !sessionState.isStarted ? (
							<Button
								variant="default"
								size="sm"
								onClick={handleShowModal}
								className="h-8 px-3"
								aria-label="Start session"
							>
								<Play className="h-4 w-4 mr-1" />
								Start Session
							</Button>
						) : (
							<>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleTogglePause}
									className="h-8 w-8 p-0"
									aria-label={
										sessionState.isRunning ? 'Pause timer' : 'Resume timer'
									}
								>
									{sessionState.isRunning ? (
										<Pause className="h-4 w-4" />
									) : (
										<Play className="h-4 w-4" />
									)}
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleEnd}
									className="h-8 w-8 p-0"
									aria-label="End session"
								>
									<Square className="h-4 w-4" />
								</Button>
							</>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						{formatTime(getDisplayDuration())}
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						{!mounted ? (
							'Set up a session to begin tracking'
						) : mounted && sessionState.isStarted ? (
							<>
								{getProgressPercentage(sessionState.duration)}% of goal (
								{getRemainingTime(sessionState.duration)} min remaining)
							</>
						) : lastSessionDuration > 0 ? (
							<>Last session: {formatTime(lastSessionDuration)}</>
						) : (
							'Set up a session to begin tracking'
						)}
					</p>

					{/* Session Info */}
					{mounted && sessionState.isStarted && (
						<div className="mt-3 mb-2 space-y-2">
							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								<Target className="h-3 w-3" />
								<span>Goal: {formatTime(goalDuration)}</span>
							</div>
							{sessionState.startTime && (
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<span>
										Started: {new Date(sessionState.startTime).toLocaleString()}
									</span>
									<Button
										variant="ghost"
										size="sm"
										onClick={handleEditStartTime}
										className="h-6 w-6 p-0 hover:bg-muted"
										aria-label="Edit start time"
									>
										<Edit3 className="h-3 w-3" />
									</Button>
								</div>
							)}
						</div>
					)}

					{/* Progress bar */}
					{mounted && sessionState.isStarted && (
						<div className="mt-2">
							<div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
								<span>0 min</span>
								<span>{formatTime(goalDuration)}</span>
							</div>
							<div className="w-full bg-muted rounded-full h-2">
								<div
									role="progressbar"
									aria-valuenow={getProgressPercentage(sessionState.duration)}
									aria-valuemin={0}
									aria-valuemax={100}
									aria-label="Session progress"
									className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor(
										sessionState.duration
									)}`}
									style={{
										width: `${getProgressWidth(sessionState.duration)}%`
									}}
								/>
							</div>
						</div>
					)}

					{/* Status indicator */}
					<div className="flex items-center gap-2 mt-3">
						<div
							className={`h-2 w-2 rounded-full ${
								!mounted
									? 'bg-gray-400'
									: sessionState.isEnded
									? 'bg-gray-500'
									: sessionState.isRunning && sessionState.isStarted
									? 'bg-green-500 animate-pulse'
									: sessionState.isStarted
									? 'bg-yellow-500'
									: 'bg-gray-400'
							}`}
						/>
						<span className="text-xs text-muted-foreground">
							{!mounted
								? 'Loading...'
								: !sessionState.isStarted
								? 'Ready to Start'
								: sessionState.isEnded
								? 'Session Ended'
								: sessionState.isRunning
								? 'Live'
								: 'Paused'}
						</span>
					</div>
				</CardContent>
			</Card>

			{/* Session Setup Modal */}
			<Dialog
				open={showSessionModal}
				onOpenChange={(open) =>
					open ? openSessionModal() : closeSessionModal()
				}
			>
				<div className="space-y-6">
					<DialogHeader>
						<DialogTitle>Start New Session</DialogTitle>
						<DialogDescription>
							Set your session goals and preferences before starting.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="duration-goal">Duration Goal</Label>
							<Select
								value={goalDuration.toString()}
								onValueChange={(value) => setGoalDuration(parseInt(value))}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{GOAL_OPTIONS.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="sales-goal">Sales Goal ($)</Label>
							<Input
								id="sales-goal"
								type="number"
								value={salesGoalState.goalAmount}
								onChange={(e) => setSalesGoal(Number(e.target.value))}
								placeholder="Enter sales goal"
								min="0"
								step="100"
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={closeSessionModal}
						>
							Cancel
						</Button>
						<Button onClick={handleStartSession}>
							<Play className="h-4 w-4 mr-1" />
							Start Session
						</Button>
					</DialogFooter>
				</div>
			</Dialog>

			{/* Edit Start Time Modal */}
			<Dialog
				open={showEditStartTimeModal}
				onOpenChange={(open) =>
					open ? setShowEditStartTimeModal(true) : handleCancelEditStartTime()
				}
			>
				<div className="space-y-6">
					<DialogHeader>
						<DialogTitle>Edit Session Start Time</DialogTitle>
						<DialogDescription>
							Adjust the start time to include orders that occurred before you
							started the session.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="start-time">Start Time</Label>
							<Input
								id="start-time"
								type="datetime-local"
								value={editStartTimeValue}
								onChange={(e) => setEditStartTimeValue(e.target.value)}
								max={new Date().toISOString().slice(0, 16)}
							/>
							<p className="text-xs text-muted-foreground">
								Start time cannot be in the future
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={handleCancelEditStartTime}
						>
							Cancel
						</Button>
						<Button onClick={handleSaveStartTime}>Save Changes</Button>
					</DialogFooter>
				</div>
			</Dialog>

			{/* Confetti celebration for goal achievement */}
			<ConfettiCelebration
				isActive={showConfetti}
				onComplete={handleConfettiComplete}
				duration={4000}
				numberOfPieces={250}
			/>
		</>
	)
}
