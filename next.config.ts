import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	/* config options here */
	webpack: (config, { isServer }) => {
		// Bundle analyzer configuration
		if (process.env.ANALYZE === 'true') {
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
