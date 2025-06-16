import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	/* config options here */
}

// Only add webpack configuration when bundle analysis is enabled
// This prevents conflicts with Turbopack in development
if (process.env.ANALYZE === 'true') {
	nextConfig.webpack = (config, { isServer, dev }) => {
		// Bundle analyzer only works with webpack builds (not Turbopack)
		if (!dev) {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

			config.plugins.push(
				new BundleAnalyzerPlugin({
					analyzerMode: 'static',
					reportFilename: isServer
						? '../analyze/server.html'
						: './analyze/client.html',
					openAnalyzer: false,
					generateStatsFile: true,
					statsFilename: isServer
						? '../analyze/server-stats.json'
						: './analyze/client-stats.json'
				})
			)
		}

		return config
	}
}

export default nextConfig
