const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// When using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      // Error handling request
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io
  const io = new Server(httpServer, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    cors: {
      origin: process.env.NEXTAUTH_URL || `http://localhost:${port}`,
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Store Socket.io instance globally
  global.httpServer = httpServer;
  global.socketio = io;

  // Socket.io authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Decode the base64 token
      let decoded;
      try {
        const decodedString = Buffer.from(token, 'base64').toString();
        decoded = JSON.parse(decodedString);
      } catch (error) {
        // Invalid token format
        return next(new Error('Invalid token format'));
      }
      
      // Store user info on socket
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email || decoded.userEmail;
      socket.userName = decoded.name || decoded.userName;
      
      next();
    } catch (error) {
      // Authentication failed
      next(new Error('Authentication failed'));
    }
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    // User connected
    
    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Handle joining channel rooms
    socket.on('join_channel', (channelId) => {
      socket.join(`channel_${channelId}`);
      
      // Notify other channel members
      socket.to(`channel_${channelId}`).emit('user_joined_channel', {
        userId: socket.userId,
        userName: socket.userName,
        channelId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle leaving channel rooms
    socket.on('leave_channel', (channelId) => {
      socket.leave(`channel_${channelId}`);
      
      // Notify other channel members
      socket.to(`channel_${channelId}`).emit('user_left_channel', {
        userId: socket.userId,
        userName: socket.userName,
        channelId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle new messages
    socket.on('send_message', async (data) => {
      try {
        const { channelId, content, receiverId } = data;

        const messageData = {
          id: Date.now().toString(), // In real app, this would come from database
          senderId: socket.userId,
          senderName: socket.userName,
          content,
          timestamp: new Date().toISOString(),
          channelId: channelId || null
        };

        if (channelId) {
          // Channel message - broadcast to all channel members
          io.to(`channel_${channelId}`).emit('new_message', messageData);
        } else if (receiverId) {
          // Direct message
          io.to(`user_${receiverId}`).emit('new_message', messageData);
          socket.emit('message_sent', messageData); // Confirmation to sender
        }
      } catch (error) {
        // Error sending message
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { channelId, receiverId } = data;
      
      const typingData = {
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date().toISOString()
      };

      if (channelId) {
        socket.to(`channel_${channelId}`).emit('user_typing', typingData);
      } else if (receiverId) {
        io.to(`user_${receiverId}`).emit('user_typing', typingData);
      }
    });

    socket.on('typing_stop', (data) => {
      const { channelId, receiverId } = data;
      
      const typingData = {
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date().toISOString()
      };

      if (channelId) {
        socket.to(`channel_${channelId}`).emit('user_stopped_typing', typingData);
      } else if (receiverId) {
        io.to(`user_${receiverId}`).emit('user_stopped_typing', typingData);
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      // User disconnected
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to real-time messaging',
      userId: socket.userId,
      userName: socket.userName
    });
  });

  httpServer
    .once('error', (err) => {
      // HTTP Server error
      process.exit(1);
    })
    .on('clientError', (err, socket) => {
      // Client error
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    })
    .listen(port, () => {
      // Server ready and listening
    });
});