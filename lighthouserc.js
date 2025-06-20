module.exports = {
	ci: {
		collect: {
			url: ['http://localhost:3000'],
			numberOfRuns: 1
		},
		assert: {
			assertions: {
				'categories:performance': ['warn', { minScore: 0.8 }],
				'categories:accessibility': ['warn', { minScore: 0.85 }],
				'categories:best-practices': ['warn', { minScore: 0.8 }],
				'categories:seo': ['warn', { minScore: 0.8 }],
				'categories:pwa': 'off'
			}
		},
		upload: {
			target: 'temporary-public-storage'
		}
	}
}
