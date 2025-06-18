'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/session-context'
import { ShoppingCart } from 'lucide-react'

export function OrderControls() {
	const { sessionState, addOrder, addSale } = useSession()

	const handleAddOrder = () => {
		addOrder()
		// Also add a random sale amount between $10-$200 for each order
		const randomSale = Math.floor(Math.random() * 191) + 10
		addSale(randomSale)
	}

	if (!sessionState.isStarted) {
		return null
	}

	return (
		<div className="space-y-2">
			<Button
				onClick={handleAddOrder}
				variant="outline"
				size="sm"
				className="w-full"
				aria-describedby="add-order-desc"
			>
				<ShoppingCart className="h-4 w-4 mr-2" />
				Add Test Order
			</Button>
			<span
				id="add-order-desc"
				className="sr-only"
			>
				Add a test order to the current session
			</span>
		</div>
	)
}
