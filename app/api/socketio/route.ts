import { NextResponse } from 'next/server'

// Socket.io server is initialized in server.js
// This endpoint just returns status
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Socket.io server should be initialized in server.js',
    path: '/api/socketio'
  })
}

