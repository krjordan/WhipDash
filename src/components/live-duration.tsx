'use client'

import * as React from 'react'
import { Play, Pause, Square, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'

const GOAL_OPTIONS = [
	{ value: '900', label: '15 min', seconds: 900 },
	{ value: '1800', label: '30 min', seconds: 1800 },
	{ value: '3600', label: '1 hour', seconds: 3600 },
	{ value: '7200', label: '2 hours', seconds: 7200 },
	{ value: '14400', label: '4 hours', seconds: 14400 }
]

export function LiveDuration() {
	const [duration, setDuration] = React.useState(0) // seconds
	const [isRunning, setIsRunning] = React.useState(true)
	const [isEnded, setIsEnded] = React.useState(false)
	const [goalDuration, setGoalDuration] = React.useState(1800) // default 30 minutes
	const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

	React.useEffect(() => {
		if (isRunning && !isEnded) {
			intervalRef.current = setInterval(() => {
				setDuration((prev) => prev + 1)
			}, 1000)
		} else {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
				intervalRef.current = null
			}
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
		}
	}, [isRunning, isEnded])

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
		if (seconds < 300) return 'bg-green-500' // 0-5 minutes: green
		if (seconds < 900) return 'bg-yellow-500' // 5-15 minutes: yellow
		if (seconds < 1800) return 'bg-orange-500' // 15-30 minutes: orange
		return 'bg-red-500' // 30+ minutes: red
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

	const handleTogglePause = () => {
		if (!isEnded) {
			setIsRunning(!isRunning)
		}
	}

	const handleEnd = () => {
		setIsRunning(false)
		setIsEnded(true)
	}

	const handleRestart = () => {
		setDuration(0)
		setIsRunning(true)
		setIsEnded(false)
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">Live Duration</CardTitle>
				<div className="flex items-center gap-2">
					{!isEnded ? (
						<>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleTogglePause}
								className="h-8 w-8 p-0"
								aria-label={isRunning ? 'Pause timer' : 'Resume timer'}
							>
								{isRunning ? (
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
					) : (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleRestart}
							className="h-8 w-8 p-0"
							aria-label="Restart session"
						>
							<Play className="h-4 w-4" />
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{formatTime(duration)}</div>
				<p className="text-xs text-muted-foreground mt-1">
					{getProgressPercentage(duration)}% of goal (
					{getRemainingTime(duration)} min remaining)
				</p>

				{/* Goal Selector */}
				<div className="mt-3 mb-2">
					<div className="flex items-center gap-2">
						<Target className="h-4 w-4 text-muted-foreground" />
						<span className="text-xs text-muted-foreground">Goal:</span>
						<Select
							value={goalDuration.toString()}
							onValueChange={(value) => setGoalDuration(parseInt(value))}
							disabled={isRunning && !isEnded}
						>
							<SelectTrigger className="w-20 h-6 text-xs">
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
				</div>

				{/* Progress bar */}
				<div className="mt-2">
					<div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
						<span>0 min</span>
						<span>{formatTime(goalDuration)}</span>
					</div>
					<div className="w-full bg-muted rounded-full h-2">
						<div
							role="progressbar"
							aria-valuenow={getProgressPercentage(duration)}
							aria-valuemin={0}
							aria-valuemax={100}
							aria-label="Session progress"
							className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor(
								duration
							)}`}
							style={{ width: `${getProgressWidth(duration)}%` }}
						/>
					</div>
				</div>

				{/* Status indicator */}
				<div className="flex items-center gap-2 mt-3">
					<div
						className={`h-2 w-2 rounded-full ${
							isEnded
								? 'bg-gray-500'
								: isRunning
								? 'bg-green-500 animate-pulse'
								: 'bg-yellow-500'
						}`}
					/>
					<span className="text-xs text-muted-foreground">
						{isEnded ? 'Session Ended' : isRunning ? 'Live' : 'Paused'}
					</span>
				</div>
			</CardContent>
		</Card>
	)
}
