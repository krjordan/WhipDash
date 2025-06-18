import { GET } from '../health/route'
import { NextResponse } from 'next/server'

// Mock NextResponse
jest.mock('next/server', () => ({
	NextResponse: {
		json: jest.fn()
	}
}))

// Mock process.uptime
const mockUptime = jest.fn()
Object.defineProperty(process, 'uptime', {
	value: mockUptime
})

describe('/api/health', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockUptime.mockReturnValue(123.45)
		;(NextResponse.json as jest.Mock).mockImplementation((data, options) => ({
			json: () => Promise.resolve(data),
			status: options?.status || 200,
			...options
		}))
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('returns healthy status with correct data', async () => {
		const originalEnv = process.env.NODE_ENV
		Object.defineProperty(process.env, 'NODE_ENV', {
			value: 'test',
			writable: true,
			configurable: true
		})

		await GET()

		expect(NextResponse.json).toHaveBeenCalledWith({
			status: 'healthy',
			timestamp: expect.any(String),
			uptime: 123.45,
			environment: 'test',
			version: '1.0.0'
		})

		Object.defineProperty(process.env, 'NODE_ENV', {
			value: originalEnv,
			writable: true,
			configurable: true
		})
	})

	it('uses development as default environment', async () => {
		const originalEnv = process.env.NODE_ENV
		Object.defineProperty(process.env, 'NODE_ENV', {
			value: undefined,
			writable: true,
			configurable: true
		})

		await GET()

		expect(NextResponse.json).toHaveBeenCalledWith({
			status: 'healthy',
			timestamp: expect.any(String),
			uptime: 123.45,
			environment: 'development',
			version: '1.0.0'
		})

		Object.defineProperty(process.env, 'NODE_ENV', {
			value: originalEnv,
			writable: true,
			configurable: true
		})
	})

	it('returns valid ISO timestamp', async () => {
		const beforeTime = new Date().toISOString()

		await GET()

		const afterTime = new Date().toISOString()
		const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0]

		expect(callArgs.timestamp).toMatch(
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
		)
		expect(callArgs.timestamp >= beforeTime).toBe(true)
		expect(callArgs.timestamp <= afterTime).toBe(true)
	})

	it('handles errors gracefully', async () => {
		// Mock console.error to avoid test output noise
		const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

		// Force an error by making uptime throw
		mockUptime.mockImplementation(() => {
			throw new Error('Uptime error')
		})

		await GET()

		expect(NextResponse.json).toHaveBeenCalledWith(
			{ error: 'Health check failed' },
			{ status: 500 }
		)
		expect(consoleSpy).toHaveBeenCalledWith(
			'Health check error:',
			expect.any(Error)
		)

		consoleSpy.mockRestore()
	})
})
