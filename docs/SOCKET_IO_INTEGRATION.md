# Socket.io Real-time Messaging Integration Guide

## Overview

This guide details how the Socket.io integration works with the messaging system, providing real-time communication across all user roles (Admin, Team Members, Clients).

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │───▶│  Next.js API    │───▶│  Socket.io      │
│   Components    │    │   Routes        │    │   Server        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ useSocketMsg    │    │   Database      │    │   Broadcast     │
│     Hook        │    │   (Prisma)      │    │   Events        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components

### 1. Socket.io Server (`lib/socket/server.ts`)

**Key Features:**
- Authentication using NextAuth session tokens
- Channel-based room management
- Real-time message broadcasting
- User presence tracking
- Role-based access control

**Events Handled:**
```typescript
// Channel Management
'join_channel' - User joins a messaging channel
'leave_channel' - User leaves a messaging channel

// Messaging
'send_message' - Send a new message
'mark_message_read' - Mark message as read
'add_reaction' - Add emoji reaction to message

// Typing Indicators
'typing_start' - User starts typing
'typing_stop' - User stops typing
```

**Events Emitted:**
```typescript
// Message Events
'new_message' - New message received
'message_read' - Message read by someone
'message_reaction_added' - Reaction added to message

// User Presence
'user_joined_channel' - User joined channel
'user_left_channel' - User left channel
'user_typing' - User is typing
'user_stopped_typing' - User stopped typing

// Errors
'error' - Error occurred
```

### 2. Client Hook (`hooks/use-socket-messaging.ts`)

**Features:**
- Automatic connection management with authentication
- Auto-reconnection on network issues
- Event-driven messaging interface
- Typing indicator management
- Error handling

**Usage Example:**
```typescript
const {
  isConnected,
  joinChannel,
  sendMessage,
  startTyping,
  stopTyping
} = useSocketMessaging({
  onNewMessage: (message) => {
    // Handle new message
    setMessages(prev => [...prev, message])
  },
  onTypingStart: (data) => {
    // Show typing indicator
    setTypingUsers(prev => [...prev, data.userId])
  },
  onError: (error) => {
    // Handle errors
    showNotification(error.message)
  }
})
```

### 3. API Integration

All messaging API routes now emit Socket.io events after database operations:

**Message Creation Flow:**
1. Client sends HTTP POST to `/api/[role]/messages`
2. API validates request and creates message in database
3. API broadcasts message via Socket.io to channel members
4. Connected clients receive real-time update

**Example (Admin API):**
```typescript
// Create message in database
const newMessage = await prisma.message.create({...})

// Broadcast via Socket.io
const socketManager = getSocketManager()
if (socketManager) {
  socketManager.io.to(`channel_${channelId}`).emit('new_message', {
    message: messageData,
    timestamp: new Date().toISOString()
  })
}
```

## Implementation Details

### Authentication

Socket.io uses base64-encoded session data for authentication:

```typescript
const authToken = btoa(JSON.stringify({
  userId: session.user.id,
  email: session.user.email,
  name: session.user.name
}))

const socket = io(url, {
  auth: { token: authToken }
})
```

### Channel Management

Users automatically join channels based on their role and permissions:

- **Admins**: Access to all channels
- **Team Members**: Team channels + assigned project channels
- **Clients**: Only project channels they're assigned to

### Real-time Features

#### 1. Live Messaging
- Messages appear instantly without page refresh
- Support for replies/threading
- Message read receipts

#### 2. Typing Indicators
- Shows when someone is typing in a channel
- Automatically clears after inactivity

#### 3. User Presence
- Shows who's online in channels
- Join/leave notifications

#### 4. Reactions
- Real-time emoji reactions to messages
- Live reaction counters

## UI Integration Examples

### Admin Messages Component

```typescript
// app/admin/messages/page.tsx
import useSocketMessaging from "@/hooks/use-socket-messaging"

const {
  isConnected,
  joinChannel,
  sendMessage: sendSocketMessage
} = useSocketMessaging({
  onNewMessage: (message) => {
    setMessages(prev => [...prev, message])
    scrollToBottom()
  }
})

// Join channel when selected
useEffect(() => {
  if (selectedChannel) {
    joinChannel(selectedChannel.id)
  }
}, [selectedChannel])
```

### Team Member Chat Component

```typescript
// app/team-member/chat/page.tsx
const {
  isConnected,
  joinChannel,
  startTyping,
  stopTyping
} = useSocketMessaging({
  onNewMessage: handleNewMessage,
  onTypingStart: handleTypingStart,
  onTypingStop: handleTypingStop
})

// Typing indicators
const handleInputChange = (value: string) => {
  setMessage(value)
  
  if (value.trim() && !isTyping) {
    startTyping(selectedChannel?.id)
    setIsTyping(true)
  } else if (!value.trim() && isTyping) {
    stopTyping(selectedChannel?.id)
    setIsTyping(false)
  }
}
```

## Development Setup

### 1. Environment Variables

```env
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### 2. Start Development Server

```bash
npm run dev
```

The Socket.io server is automatically initialized when the first client connects.

### 3. Testing Real-time Features

1. Open multiple browser windows/tabs
2. Login as different users (Admin, Team Member, Client)
3. Join the same channel
4. Send messages and observe real-time updates

## Production Deployment

### Considerations

1. **Scaling**: Use Redis adapter for multiple server instances
2. **SSL**: Ensure proper HTTPS/WSS configuration
3. **Monitoring**: Add Socket.io connection metrics
4. **Error Handling**: Implement proper fallbacks for connection failures

### Example Redis Adapter Setup

```typescript
// lib/socket/server.ts
import { createAdapter } from "@socket.io/redis-adapter"
import { createClient } from "redis"

const pubClient = createClient({ url: process.env.REDIS_URL })
const subClient = pubClient.duplicate()

await Promise.all([pubClient.connect(), subClient.connect()])

io.adapter(createAdapter(pubClient, subClient))
```

## Security Features

1. **Authentication**: All connections require valid session tokens
2. **Authorization**: Channel access based on user roles and project membership
3. **Rate Limiting**: Prevent spam and abuse
4. **Input Validation**: All messages validated before processing

## Monitoring & Debugging

### Connection Status Indicator

```typescript
const ConnectionStatus = () => {
  const { isConnected } = useSocketMessaging()
  
  return (
    <div className={`flex items-center gap-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-600' : 'bg-red-600'}`} />
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  )
}
```

### Debug Logging

Socket events are logged to console for development:

```typescript
console.log('📨 New message received:', message)
console.log('👋 User joined channel:', data)
console.log('✅ Message read:', data)
```

## API Endpoints Enhanced

All existing messaging API endpoints now support real-time broadcasting:

- `POST /api/admin/messages` - Admin messaging with broadcast
- `POST /api/team-member/messages` - Team member messaging with broadcast  
- `POST /api/client/messages` - Client messaging with broadcast
- `GET /api/[role]/messages/channels` - Channel listing (static)
- `GET /api/[role]/messages/[channelId]` - Message history (static)

## Next Steps

1. **Performance Optimization**: Implement message pagination for large channels
2. **File Sharing**: Add real-time file upload progress and notifications
3. **Video/Voice**: Integrate WebRTC for voice/video calls
4. **Mobile Support**: Ensure Socket.io works properly on mobile devices
5. **Offline Support**: Queue messages when offline and sync when reconnected

## Troubleshooting

### Common Issues

1. **Connection Fails**: Check authentication token and network connectivity
2. **Messages Not Real-time**: Verify Socket.io server is running and channels are joined
3. **High CPU Usage**: Check for memory leaks in event listeners
4. **CORS Issues**: Ensure proper CORS configuration for WebSocket connections

### Debug Commands

```bash
# Check Socket.io connections
curl http://localhost:3000/api/socket/io

# Monitor Prisma queries
npx prisma studio

# Check logs
npm run dev --verbose
```

This Socket.io integration provides a robust, scalable real-time messaging system that enhances the user experience across all roles while maintaining security and performance.