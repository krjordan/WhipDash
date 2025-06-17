'use client'

import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'

interface ConfettiCelebrationProps {
	/** Whether to show the confetti */
	isActive: boolean
	/** Duration in milliseconds for how long the confetti should run */
	duration?: number
	/** Number of confetti pieces */
	numberOfPieces?: number
	/** Custom colors for the confetti */
	colors?: string[]
	/** Callback when confetti animation ends */
	onComplete?: () => void
}

export function ConfettiCelebration({
	isActive,
	duration = 3000,
	numberOfPieces = 200,
	colors = [
		'#f44336', // red
		'#e91e63', // pink
		'#9c27b0', // purple
		'#673ab7', // deep purple
		'#3f51b5', // indigo
		'#2196f3', // blue
		'#03a9f4', // light blue
		'#00bcd4', // cyan
		'#009688', // teal
		'#4CAF50', // green
		'#8BC34A', // light green
		'#CDDC39', // lime
		'#FFEB3B', // yellow
		'#FFC107', // amber
		'#FF9800', // orange
		'#FF5722' // deep orange
	],
	onComplete
}: ConfettiCelebrationProps) {
	const { width, height } = useWindowSize()
	const [showConfetti, setShowConfetti] = useState(false)

	useEffect(() => {
		if (isActive) {
			setShowConfetti(true)

			// Auto-stop confetti after duration
			const timer = setTimeout(() => {
				setShowConfetti(false)
				onComplete?.()
			}, duration)

			return () => clearTimeout(timer)
		} else {
			setShowConfetti(false)
		}
	}, [isActive, duration, onComplete])

	if (!showConfetti) return null

	return (
		<Confetti
			width={width}
			height={height}
			numberOfPieces={numberOfPieces}
			colors={colors}
			recycle={false}
			gravity={0.3}
			wind={0.01}
			initialVelocityY={20}
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				zIndex: 9999,
				pointerEvents: 'none'
			}}
		/>
	)
}
