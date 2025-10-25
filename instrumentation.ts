/**
 * Next.js Instrumentation Hook
 * This runs once when the Next.js server starts (both dev and production)
 * Perfect place to initialize Socket.io for all server modes
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeSocketIO } = await import('@/lib/socket-server')
    
    console.log('🔌 Initializing Socket.io server...')
    
    try {
      await initializeSocketIO()
      console.log('✅ Socket.io server initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Socket.io:', error)
    }
  }
}
