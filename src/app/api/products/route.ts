import { NextRequest, NextResponse } from 'next/server'
import {
	shopify,
	createShopifySession,
	type ShopifyProductsResponse,
	type InventoryLevelsResponse,
	type ProductWithInventory,
	type ProductVariantWithInventory
} from '@/lib/shopify'

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const soldOutOnly = searchParams.get('sold_out_only') === 'true'

		const session = createShopifySession()
		const client = new shopify.clients.Rest({ session })

		// First, get all products with variants
		const productsResponse = await client.get({
			path: 'products',
			query: {
				limit: 250,
				fields: 'id,title,handle,created_at,updated_at,variants,image'
			}
		})

		const products = productsResponse.body as ShopifyProductsResponse

		// Collect all inventory item IDs first to batch the request
		const allInventoryItemIds = new Set<string>()
		for (const product of products.products) {
			for (const variant of product.variants) {
				if (variant.inventory_item_id) {
					allInventoryItemIds.add(variant.inventory_item_id.toString())
				}
			}
		}

		// Batch fetch all inventory levels in a single request (up to 50 at a time)
		const inventoryMap = new Map<string, number>()

		if (allInventoryItemIds.size > 0) {
			try {
				const inventoryItemIdsArray = Array.from(allInventoryItemIds)

				// Shopify allows up to 50 inventory_item_ids per request
				const batchSize = 50
				for (let i = 0; i < inventoryItemIdsArray.length; i += batchSize) {
					const batch = inventoryItemIdsArray.slice(i, i + batchSize)

					const inventoryResponse = await client.get({
						path: 'inventory_levels',
						query: {
							inventory_item_ids: batch.join(','),
							limit: 250
						}
					})

					const inventoryLevels =
						inventoryResponse.body as InventoryLevelsResponse

					// Process inventory levels and aggregate by inventory_item_id
					if (inventoryLevels.inventory_levels) {
						for (const level of inventoryLevels.inventory_levels) {
							const itemId = level.inventory_item_id.toString()
							const currentTotal = inventoryMap.get(itemId) || 0
							inventoryMap.set(itemId, currentTotal + (level.available || 0))
						}
					}

					// Add delay between batches to respect rate limits
					if (i + batchSize < inventoryItemIdsArray.length) {
						await new Promise((resolve) => setTimeout(resolve, 500)) // 500ms delay
					}
				}
			} catch (inventoryError) {
				console.warn('Failed to fetch inventory levels:', inventoryError)
			}
		}

		// Process products with the batched inventory data
		const productsWithInventory: ProductWithInventory[] = []

		for (const product of products.products) {
			const variants: ProductVariantWithInventory[] = []

			for (const variant of product.variants) {
				const inventoryItemId = variant.inventory_item_id?.toString()
				const totalInventory = inventoryItemId
					? inventoryMap.get(inventoryItemId) || 0
					: 0
				const isSoldOut =
					variant.inventory_management === 'shopify'
						? totalInventory === 0
						: false

				variants.push({
					id: variant.id,
					title: variant.title,
					price: variant.price,
					sku: variant.sku,
					inventory_item_id: variant.inventory_item_id,
					inventory_management: variant.inventory_management,
					inventory_policy: variant.inventory_policy,
					inventory_quantity: totalInventory,
					is_sold_out: isSoldOut,
					created_at: variant.created_at,
					updated_at: variant.updated_at
				})
			}

			// Check if any variant is sold out
			const hasSoldOutVariants = variants.some((v) => v.is_sold_out)
			const allVariantsSoldOut = variants.every((v) => v.is_sold_out)

			// If filtering for sold out only, include only products with sold out variants
			if (soldOutOnly && !hasSoldOutVariants) {
				continue
			}

			productsWithInventory.push({
				id: product.id,
				title: product.title,
				handle: product.handle,
				created_at: product.created_at,
				updated_at: product.updated_at,
				image: product.image,
				variants: variants,
				has_sold_out_variants: hasSoldOutVariants,
				all_variants_sold_out: allVariantsSoldOut
			})
		}

		// Apply additional filtering if needed
		let filteredProducts = productsWithInventory

		if (soldOutOnly) {
			filteredProducts = productsWithInventory.filter(
				(p) => p.has_sold_out_variants
			)
		}

		const response = {
			products: filteredProducts,
			total_count: filteredProducts.length,
			sold_out_count: productsWithInventory.filter(
				(p) => p.has_sold_out_variants
			).length,
			filter: {
				sold_out_only: soldOutOnly
			}
		}

		return NextResponse.json(response)
	} catch (error) {
		console.error('Error fetching products:', error)

		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error occurred'

		return NextResponse.json(
			{
				error: 'Failed to fetch products',
				details: errorMessage
			},
			{ status: 500 }
		)
	}
}
