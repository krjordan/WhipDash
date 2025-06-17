'use client'

import { Badge } from '@/components/ui/badge'
import { useSession } from '@/lib/session-context'

export function LiveStatusBadge() {
	const { sessionState } = useSession()

	const getStatusConfig = () => {
		switch (sessionState.status) {
			case 'live':
				return {
					text: 'Live',
					className: 'text-green-600 border-green-600 animate-pulse',
					ariaLabel: 'Dashboard status: Live session active'
				}
			case 'paused':
				return {
					text: 'Paused',
					className: 'text-yellow-600 border-yellow-600',
					ariaLabel: 'Dashboard status: Session paused'
				}
			case 'ended':
				return {
					text: 'Ended',
					className: 'text-gray-600 border-gray-600',
					ariaLabel: 'Dashboard status: Session ended'
				}
			default:
				return {
					text: 'Ready',
					className: 'text-blue-600 border-blue-600',
					ariaLabel: 'Dashboard status: Ready to start session'
				}
		}
	}

	const { text, className, ariaLabel } = getStatusConfig()

	return (
		<Badge
			variant="outline"
			className={className}
			role="status"
			aria-label={ariaLabel}
		>
			{text}
		</Badge>
	)
}
