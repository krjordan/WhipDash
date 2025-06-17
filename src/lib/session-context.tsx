'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

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

interface SessionContextType {
	sessionState: SessionState
	salesGoalState: SalesGoalState
	startSession: () => void
	pauseSession: () => void
	resumeSession: () => void
	endSession: () => void
	setSalesGoal: (amount: number) => void
	addSale: (amount: number) => void
	resetSales: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

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

	return (
		<SessionContext.Provider
			value={{
				sessionState,
				salesGoalState,
				startSession,
				pauseSession,
				resumeSession,
				endSession,
				setSalesGoal,
				addSale,
				resetSales
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
