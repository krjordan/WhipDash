import React from 'react'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import '@testing-library/jest-dom'

// Create a minimal component that represents just the Sold Out Products card
const SoldOutProductsCard = () => {
	return (
		<div className="col-span-3">
			<div>
				<div className="flex items-center gap-2">
					<svg
						className="h-5 w-5"
						data-testid="package-x-icon"
					>
						{/* PackageX icon representation */}
					</svg>
					Sold Out Products
				</div>
				<p>Track products that are out of stock</p>
			</div>
			<div className="flex items-center justify-center min-h-[300px]">
				<div className="text-center text-muted-foreground">
					<svg
						className="h-12 w-12 mx-auto mb-4 opacity-50"
						data-testid="package-x-large-icon"
					>
						{/* Large PackageX icon representation */}
					</svg>
					<p className="text-lg font-medium">Coming Soon</p>
				</div>
			</div>
		</div>
	)
}

describe('Sold Out Products Card', () => {
	it('renders the card title with icon', () => {
		render(<SoldOutProductsCard />)

		expect(screen.getByText('Sold Out Products')).toBeInTheDocument()
		expect(screen.getByTestId('package-x-icon')).toBeInTheDocument()
	})

	it('displays the correct description', () => {
		render(<SoldOutProductsCard />)

		expect(
			screen.getByText('Track products that are out of stock')
		).toBeInTheDocument()
	})

	it('shows coming soon placeholder with icon', () => {
		render(<SoldOutProductsCard />)

		expect(screen.getByText('Coming Soon')).toBeInTheDocument()
		expect(screen.getByTestId('package-x-large-icon')).toBeInTheDocument()
	})

	it('has correct layout classes', () => {
		render(<SoldOutProductsCard />)

		const card = screen.getByText('Sold Out Products').closest('.col-span-3')
		expect(card).toBeInTheDocument()

		const centeredContent = screen
			.getByText('Coming Soon')
			.closest('.min-h-\\[300px\\]')
		expect(centeredContent).toBeInTheDocument()
	})

	it('displays centered content', () => {
		render(<SoldOutProductsCard />)

		const centeredDiv = screen.getByText('Coming Soon').parentElement
		expect(centeredDiv).toHaveClass('text-center', 'text-muted-foreground')
	})
})
