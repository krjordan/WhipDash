'use client'

import * as React from 'react'
import { PackageX, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/lib/session-context'
import { useProducts } from '@/lib/shopify-api'
import type { ProductWithInventory } from '@/lib/shopify'

export function SoldOutProducts() {
	const { sessionState, addSoldOutProduct } = useSession()
	const [mounted, setMounted] = React.useState(false)
	const [sessionStartInventory, setSessionStartInventory] = React.useState<
		Map<string, number>
	>(new Map())
	const [lastUpdateTime, setLastUpdateTime] = React.useState<Date | null>(null)
	const [showAllSoldOut, setShowAllSoldOut] = React.useState(false)

	React.useEffect(() => {
		setMounted(true)
	}, [])

	// Fetch products data when session is active
	const isTestEnvironment =
		typeof process !== 'undefined' &&
		(process.env.NODE_ENV === 'test' ||
			process.env.JEST_WORKER_ID !== undefined)

	const {
		data: productsData,
		loading: productsLoading,
		error: productsError,
		refetch: refetchProducts
	} = useProducts({
		soldOutOnly: true, // Only fetch sold out products for efficiency
		refreshInterval:
			sessionState.isRunning && !isTestEnvironment ? 30000 : undefined, // 30 seconds when live
		enabled: sessionState.isStarted && !isTestEnvironment
	})

	// Update last update time when data changes successfully
	React.useEffect(() => {
		if (productsData && !productsError) {
			setLastUpdateTime(new Date())
		}
	}, [productsData, productsError])

	// Track inventory levels at session start
	React.useEffect(() => {
		if (
			sessionState.isStarted &&
			sessionState.sessionId &&
			sessionStartInventory.size === 0
		) {
			// Fetch all products to track initial inventory levels
			fetch('/api/products')
				.then((response) => response.json())
				.then((data) => {
					const inventoryMap = new Map<string, number>()
					data.products.forEach((product: ProductWithInventory) => {
						product.variants.forEach((variant) => {
							inventoryMap.set(
								variant.id.toString(),
								variant.inventory_quantity
							)
						})
					})
					setSessionStartInventory(inventoryMap)
				})
				.catch((error) => {
					console.warn('Failed to track session start inventory:', error)
				})
		}

		// Clear tracking when session ends
		if (!sessionState.isStarted) {
			setSessionStartInventory(new Map())
		}
	}, [
		sessionState.isStarted,
		sessionState.sessionId,
		sessionStartInventory.size
	])

	// Filter products that went out of stock during this session
	const getProductsOutOfStockThisSession = () => {
		if (!productsData?.products || sessionStartInventory.size === 0) {
			return []
		}

		return productsData.products.filter((product) => {
			return product.variants.some((variant) => {
				const startInventory =
					sessionStartInventory.get(variant.id.toString()) || 0
				return startInventory > 0 && variant.is_sold_out
			})
		})
	}

	const allSoldOutProducts = productsData?.products || []
	const sessionSoldOutProducts = getProductsOutOfStockThisSession()

	// Report session sold-out products to session context
	React.useEffect(() => {
		if (sessionState.isStarted && sessionSoldOutProducts.length > 0) {
			sessionSoldOutProducts.forEach((product) => {
				const persistedProduct = {
					id: product.id,
					title: product.title,
					handle: product.handle,
					soldOutVariantsCount: getSoldOutVariantsCount(product),
					totalVariantsCount: product.variants.length,
					soldOutAt: new Date().toISOString()
				}
				// Add to session context (will handle deduplication)
				if (typeof addSoldOutProduct === 'function') {
					addSoldOutProduct(persistedProduct)
				}
			})
		}
	}, [sessionSoldOutProducts, sessionState.isStarted, addSoldOutProduct])

	const getSoldOutVariantsCount = (product: ProductWithInventory) => {
		return product.variants.filter((v) => v.is_sold_out).length
	}

	const getDataSource = () => {
		if (!mounted) {
			return 'Loading...'
		}

		if (!sessionState.isStarted) {
			return 'Start a session to track sold out products'
		}

		if (productsError) {
			// Check if it's a permissions error - the error is "Failed to fetch products" for 403 errors
			if (productsError.includes('Failed to fetch products')) {
				return 'Product tracking requires additional Shopify permissions'
			}
			return 'Error loading products'
		}

		if (productsLoading) {
			return 'Loading sold out products...'
		}

		const sessionCount = sessionSoldOutProducts.length
		const totalCount = allSoldOutProducts.length

		if (!showAllSoldOut) {
			// Default: show only session sold-out products
			if (sessionCount > 0) {
				return `${sessionCount} products sold out this session`
			} else {
				return 'No products sold out this session'
			}
		} else {
			// Show all sold-out products mode
			if (sessionCount > 0) {
				return `${sessionCount} products sold out this session (${totalCount} total)`
			}
			return `${totalCount} products currently sold out`
		}
	}

	const handleRefresh = () => {
		refetchProducts()
	}

	const getShopifyUrl = (product: ProductWithInventory) => {
		// Construct Shopify admin URL for the product
		const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_SHOP || 'your-shop'
		return `https://${shopDomain}.myshopify.com/admin/products/${product.id}`
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<PackageX className="h-5 w-5" />
							Sold Out Products
						</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">
							{getDataSource()}
						</p>
					</div>
					{mounted &&
						sessionState.isStarted &&
						!(
							productsError &&
							productsError.includes('Failed to fetch products')
						) && (
							<div className="flex items-center gap-2">
								<button
									onClick={() => setShowAllSoldOut(!showAllSoldOut)}
									className={`px-3 py-1 text-xs rounded-md transition-colors ${
										showAllSoldOut
											? 'bg-muted text-muted-foreground hover:bg-muted/80'
											: 'bg-orange-100 text-orange-700 border border-orange-200'
									}`}
									aria-label={
										showAllSoldOut
											? 'Show only session sold out products'
											: 'Show all sold out products'
									}
								>
									{showAllSoldOut ? 'Session Only' : 'Show All'}
								</button>
								<button
									onClick={handleRefresh}
									disabled={productsLoading}
									className="p-2 hover:bg-muted rounded-sm transition-colors"
									aria-label="Refresh sold out products"
								>
									<RefreshCw
										className={`h-4 w-4 text-muted-foreground ${
											productsLoading ? 'animate-spin' : ''
										}`}
									/>
								</button>
							</div>
						)}
				</div>
			</CardHeader>
			<CardContent>
				{mounted && productsError && sessionState.isStarted && (
					<div className="mb-4 p-3 rounded bg-amber-50 border border-amber-200">
						{productsError.includes('Failed to fetch products') ? (
							<div>
								<p className="text-sm text-amber-800 font-medium mb-2">
									Additional Shopify Permissions Required
								</p>
								<p className="text-sm text-amber-700">
									To track sold out products, the Shopify app needs{' '}
									<code className="bg-amber-100 px-1 rounded">
										read_products
									</code>{' '}
									and{' '}
									<code className="bg-amber-100 px-1 rounded">
										read_inventory
									</code>{' '}
									permissions. Contact your Shopify app administrator to enable
									these scopes.
								</p>
							</div>
						) : (
							<p className="text-sm text-red-600">{productsError}</p>
						)}
					</div>
				)}

				{/* Sold out products list */}
				<div className="h-80 overflow-y-auto pr-2">
					<div className="space-y-4">
						{/* Show session sold-out products in "Show All" mode */}
						{sessionSoldOutProducts.length > 0 && showAllSoldOut && (
							<div>
								<div className="flex items-center gap-2 mb-3">
									<AlertTriangle className="h-4 w-4 text-orange-500" />
									<h4 className="font-medium text-sm text-orange-700">
										Sold Out This Session ({sessionSoldOutProducts.length})
									</h4>
								</div>
								<div className="space-y-3 mb-6">
									{sessionSoldOutProducts.map((product) => (
										<div
											key={product.id}
											className="border border-orange-200 bg-orange-50 rounded-lg p-3"
										>
											<div className="flex items-center justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-2">
														<h5 className="font-medium text-sm text-orange-900">
															{product.title}
														</h5>
														<a
															href={getShopifyUrl(product)}
															target="_blank"
															rel="noopener noreferrer"
															className="text-orange-600 hover:text-orange-700"
															aria-label={`View ${product.title} in Shopify admin`}
														>
															<ExternalLink className="h-3 w-3" />
														</a>
													</div>
													<p className="text-xs text-orange-600 mt-1">
														{getSoldOutVariantsCount(product)} of{' '}
														{product.variants.length} variants sold out
													</p>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Show only session sold out products (default mode) */}
						{!showAllSoldOut && (
							<div className="space-y-3">
								{sessionSoldOutProducts.length === 0 ? (
									<div className="text-center py-8 text-muted-foreground">
										<PackageX className="h-12 w-12 mx-auto mb-4 opacity-50" />
										<p>No products sold out during this session</p>
									</div>
								) : (
									sessionSoldOutProducts.map((product) => (
										<div
											key={product.id}
											className="border border-orange-200 bg-orange-50 rounded-lg p-3"
										>
											<div className="flex items-center justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-2">
														<h5 className="font-medium text-sm text-orange-900">
															{product.title}
														</h5>
														<a
															href={getShopifyUrl(product)}
															target="_blank"
															rel="noopener noreferrer"
															className="text-orange-600 hover:text-orange-700"
															aria-label={`View ${product.title} in Shopify admin`}
														>
															<ExternalLink className="h-3 w-3" />
														</a>
													</div>
													<p className="text-xs text-orange-600 mt-1">
														{getSoldOutVariantsCount(product)} of{' '}
														{product.variants.length} variants sold out
													</p>
												</div>
											</div>
										</div>
									))
								)}
							</div>
						)}

						{/* Show all other sold out products */}
						{showAllSoldOut &&
							(productsError &&
							productsError.includes('Failed to fetch products') ? (
								<div className="text-center py-8 text-muted-foreground">
									<PackageX className="h-12 w-12 mx-auto mb-4 opacity-50" />
									<p>
										Product tracking will be available once Shopify permissions
										are enabled
									</p>
								</div>
							) : allSoldOutProducts.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									<PackageX className="h-12 w-12 mx-auto mb-4 opacity-50" />
									<p>
										{mounted && sessionState.isStarted
											? 'No products are currently sold out'
											: 'Start a session to track sold out products'}
									</p>
								</div>
							) : (
								<div className="space-y-3">
									{allSoldOutProducts
										.filter(
											(product) =>
												!sessionSoldOutProducts.find(
													(sp) => sp.id === product.id
												)
										)
										.map((product) => (
											<div
												key={product.id}
												className="border border-border rounded-lg p-3"
											>
												<div className="flex items-center justify-between">
													<div className="flex-1">
														<div className="flex items-center gap-2">
															<h5 className="font-medium text-sm">
																{product.title}
															</h5>
															<a
																href={getShopifyUrl(product)}
																target="_blank"
																rel="noopener noreferrer"
																className="text-muted-foreground hover:text-foreground"
																aria-label={`View ${product.title} in Shopify admin`}
															>
																<ExternalLink className="h-3 w-3" />
															</a>
														</div>
														<p className="text-xs text-muted-foreground mt-1">
															{getSoldOutVariantsCount(product)} of{' '}
															{product.variants.length} variants sold out
														</p>
													</div>
												</div>
											</div>
										))}
								</div>
							))}
					</div>
				</div>

				{/* Status indicator */}
				{mounted && sessionState.isStarted && (
					<div className="flex items-center gap-2 mt-4 pt-4 border-t">
						<div
							className={`h-2 w-2 rounded-full ${
								productsError
									? 'bg-red-500'
									: productsLoading
									? 'bg-orange-500 animate-pulse'
									: productsData
									? 'bg-green-500'
									: 'bg-gray-400'
							}`}
						/>
						<span className="text-xs text-muted-foreground">
							{productsError
								? 'Connection Error'
								: productsLoading
								? 'Loading products...'
								: productsData && lastUpdateTime
								? `Last updated: ${lastUpdateTime.toLocaleTimeString()}`
								: 'Waiting for data'}
						</span>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
