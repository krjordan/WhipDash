'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface SessionState {
	isStarted: boolean
	isRunning: boolean
	isEnded: boolean
	status: 'ready' | 'live' | 'paused' | 'ended'
}

interface SessionContextType {
	sessionState: SessionState
	startSession: () => void
	pauseSession: () => void
	resumeSession: () => void
	endSession: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
	const [sessionState, setSessionState] = useState<SessionState>({
		isStarted: false,
		isRunning: false,
		isEnded: false,
		status: 'ready'
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
	}

	return (
		<SessionContext.Provider
			value={{
				sessionState,
				startSession,
				pauseSession,
				resumeSession,
				endSession
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
