'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
	React.useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onOpenChange(false)
			}
		}

		if (open) {
			document.addEventListener('keydown', handleEscape)
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'unset'
		}

		return () => {
			document.removeEventListener('keydown', handleEscape)
			document.body.style.overflow = 'unset'
		}
	}, [open, onOpenChange])

	if (!open) return null

	return (
		<div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
			<div
				className="fixed inset-0"
				onClick={() => onOpenChange(false)}
			/>
			<div className="relative bg-background text-foreground border rounded-lg shadow-lg max-w-lg w-full p-6">
				<button
					onClick={() => onOpenChange(false)}
					className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
				>
					<X className="h-4 w-4" />
					<span className="sr-only">Close</span>
				</button>
				{children}
			</div>
		</div>
	)
}

export function DialogHeader({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				'flex flex-col space-y-1.5 text-center sm:text-left',
				className
			)}
			{...props}
		/>
	)
}

export function DialogTitle({
	className,
	...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h2
			className={cn(
				'text-lg font-semibold leading-none tracking-tight',
				className
			)}
			{...props}
		/>
	)
}

export function DialogDescription({
	className,
	...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p
			className={cn('text-sm text-muted-foreground', className)}
			{...props}
		/>
	)
}

export function DialogFooter({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
				className
			)}
			{...props}
		/>
	)
}
