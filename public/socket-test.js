// Test Socket.io connection in browser console
// Run this in the browser developer console to test Socket.io

console.log('🧪 Testing Socket.io Connection...');

// Create a test connection
const testSocket = io('http://localhost:3000', {
  path: '/api/socket/io',
  auth: {
    token: btoa(JSON.stringify({
      userId: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User'
    }))
  }
});

testSocket.on('connect', () => {
  console.log('✅ Socket.io Connected!', testSocket.id);
  
  // Test joining a channel
  testSocket.emit('join_channel', 'general');
  
  // Test sending a message
  setTimeout(() => {
    testSocket.emit('send_message', {
      channelId: 'general',
      content: 'Hello from Socket.io test!'
    });
  }, 1000);
});

testSocket.on('connected', (data) => {
  console.log('🎉 Welcome message:', data);
});

testSocket.on('new_message', (message) => {
  console.log('📨 New message received:', message);
});

testSocket.on('user_joined_channel', (data) => {
  console.log('👋 User joined:', data);
});

testSocket.on('disconnect', () => {
  console.log('❌ Socket.io Disconnected');
});

testSocket.on('error', (error) => {
  console.error('🚨 Socket.io Error:', error);
});

// Test the connection
console.log('Socket.io client created, waiting for connection...');

// Cleanup function
window.cleanupSocketTest = () => {
  testSocket.disconnect();
  console.log('🧹 Socket.io test connection cleaned up');
};