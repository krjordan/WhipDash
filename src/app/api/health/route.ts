import { NextResponse } from 'next/server'

export async function GET() {
	try {
		return NextResponse.json({
			status: 'healthy',
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			environment: process.env.NODE_ENV || 'development',
			version: '1.0.0'
		})
	} catch (error) {
		console.error('Health check error:', error)
		return NextResponse.json({ error: 'Health check failed' }, { status: 500 })
	}
}
