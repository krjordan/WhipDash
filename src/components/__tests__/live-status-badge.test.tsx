import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LiveStatusBadge } from '../live-status-badge'

// Mock the useSession hook
const mockUseSession = jest.fn()

jest.mock('../../lib/session-context', () => ({
	useSession: () => mockUseSession()
}))

describe('LiveStatusBadge Component', () => {
	afterEach(() => {
		jest.clearAllMocks()
	})

	it('shows "Ready" status with blue styling when session is ready', () => {
		mockUseSession.mockReturnValue({
			sessionState: {
				isStarted: false,
				isRunning: false,
				isEnded: false,
				status: 'ready'
			}
		})

		render(<LiveStatusBadge />)

		const badge = screen.getByText('Ready')
		expect(badge).toBeInTheDocument()
		expect(badge).toHaveClass('text-blue-600', 'border-blue-600')
		expect(badge).toHaveAttribute(
			'aria-label',
			'Dashboard status: Ready to start session'
		)
		expect(badge).toHaveAttribute('role', 'status')
	})

	it('shows "Live" status with green pulsing styling when session is active', () => {
		mockUseSession.mockReturnValue({
			sessionState: {
				isStarted: true,
				isRunning: true,
				isEnded: false,
				status: 'live'
			}
		})

		render(<LiveStatusBadge />)

		const badge = screen.getByText('Live')
		expect(badge).toBeInTheDocument()
		expect(badge).toHaveClass(
			'text-green-600',
			'border-green-600',
			'animate-pulse'
		)
		expect(badge).toHaveAttribute(
			'aria-label',
			'Dashboard status: Live session active'
		)
		expect(badge).toHaveAttribute('role', 'status')
	})

	it('shows "Paused" status with yellow styling when session is paused', () => {
		mockUseSession.mockReturnValue({
			sessionState: {
				isStarted: true,
				isRunning: false,
				isEnded: false,
				status: 'paused'
			}
		})

		render(<LiveStatusBadge />)

		const badge = screen.getByText('Paused')
		expect(badge).toBeInTheDocument()
		expect(badge).toHaveClass('text-yellow-600', 'border-yellow-600')
		expect(badge).toHaveAttribute(
			'aria-label',
			'Dashboard status: Session paused'
		)
		expect(badge).toHaveAttribute('role', 'status')
	})

	it('shows "Ended" status with gray styling when session is ended', () => {
		mockUseSession.mockReturnValue({
			sessionState: {
				isStarted: false,
				isRunning: false,
				isEnded: true,
				status: 'ended'
			}
		})

		render(<LiveStatusBadge />)

		const badge = screen.getByText('Ended')
		expect(badge).toBeInTheDocument()
		expect(badge).toHaveClass('text-gray-600', 'border-gray-600')
		expect(badge).toHaveAttribute(
			'aria-label',
			'Dashboard status: Session ended'
		)
		expect(badge).toHaveAttribute('role', 'status')
	})

	it('has proper accessibility attributes', () => {
		mockUseSession.mockReturnValue({
			sessionState: {
				isStarted: true,
				isRunning: true,
				isEnded: false,
				status: 'live'
			}
		})

		render(<LiveStatusBadge />)

		const badge = screen.getByRole('status')
		expect(badge).toBeInTheDocument()
		expect(badge).toHaveAttribute('aria-label')
	})
})
