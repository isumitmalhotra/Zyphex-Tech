import { NextRequest } from 'next/server';

// This route provides Socket.io status information
// The actual Socket.io server is handled by server.js
export async function GET(req: NextRequest) {
  try {
    // Check if Socket.io is available
    const io = (global as any).socketio;
    
    if (io) {
      return Response.json({ 
        status: 'running',
        message: 'Socket.io server is running',
        path: '/api/socket/io',
        connected: io.engine.clientsCount || 0
      });
    }
    
    return Response.json({ 
      status: 'not_initialized',
      message: 'Socket.io server not found - make sure to run with custom server',
    }, { status: 503 });
  } catch (error) {
    return Response.json({ 
      error: 'Socket.io status check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  return Response.json({ 
    error: 'Method not allowed',
    message: 'Use WebSocket connection for real-time communication'
  }, { status: 405 });
}