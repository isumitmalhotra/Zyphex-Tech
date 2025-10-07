import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface SocketEvents {
  // Task events
  task_updated: (data: any) => void;
  
  // Milestone events
  milestone_updated: (data: any) => void;
  
  // Message events
  new_message: (data: any) => void;
  
  // Typing events
  user_typing: (data: any) => void;
  user_stopped_typing: (data: any) => void;
  
  // Project events
  user_joined_project: (data: any) => void;
  user_left_project: (data: any) => void;
  
  // Notification events
  notification: (data: any) => void;
  role_notification: (data: any) => void;
  
  // Error events
  error: (data: any) => void;
}

export function useSocket() {
  const { data: session, status } = useSession();
  const socketRef = useRef<Socket>();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [joinedProjects, setJoinedProjects] = useState<Set<string>>(new Set());
  const joinedProjectsRef = useRef<Set<string>>(new Set());

  // Initialize socket connection
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
      
      // Create a simple token with user info for socket authentication
      const socketToken = btoa(JSON.stringify({
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        iat: Math.floor(Date.now() / 1000)
      }));
      
      socketRef.current = io(socketUrl, {
        path: '/api/socket/io',
        auth: {
          token: socketToken
        },
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
      });

      // Connection event handlers
      socketRef.current.on('connect', () => {
        console.log('Socket.io connected');
        setIsConnected(true);
        setConnectionError(null);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket.io disconnected:', reason);
        setIsConnected(false);
        setJoinedProjects(new Set());
        joinedProjectsRef.current.clear();
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket.io connection error:', error);
        setConnectionError(error.message);
        setIsConnected(false);
      });

      socketRef.current.on('error', (error) => {
        console.error('Socket.io error:', error);
        setConnectionError(error.message);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = undefined;
        }
        setIsConnected(false);
        setJoinedProjects(new Set());
        joinedProjectsRef.current.clear();
      };
    }
  }, [session, status]);

  // Join a project room
  const joinProject = useCallback((projectId: string) => {
    if (socketRef.current && isConnected) {
      // Check if already joined to prevent duplicate joins
      if (joinedProjectsRef.current.has(projectId)) {
        console.log(`Already joined project: ${projectId}`);
        return;
      }
      
      socketRef.current.emit('join_project', projectId);
      joinedProjectsRef.current.add(projectId);
      setJoinedProjects(prev => new Set(prev).add(projectId));
      console.log(`Joined project: ${projectId}`);
    }
  }, [isConnected]);

  // Leave a project room
  const leaveProject = useCallback((projectId: string) => {
    if (socketRef.current && isConnected) {
      // Check if actually joined before leaving
      if (!joinedProjectsRef.current.has(projectId)) {
        console.log(`Not joined to project: ${projectId}`);
        return;
      }
      
      socketRef.current.emit('leave_project', projectId);
      joinedProjectsRef.current.delete(projectId);
      setJoinedProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
      console.log(`Left project: ${projectId}`);
    }
  }, [isConnected]);

  // Send a message to a project
  const sendMessage = useCallback((projectId: string, message: string, messageType: string = 'text') => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', {
        projectId,
        message,
        messageType
      });
    }
  }, [isConnected]);

  // Update a task with real-time broadcast
  const updateTask = useCallback((taskId: string, projectId: string, updates: any, action: string = 'update') => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('task_update', {
        taskId,
        projectId,
        updates,
        action
      });
    }
  }, [isConnected]);

  // Update a milestone with real-time broadcast
  const updateMilestone = useCallback((milestoneId: string, projectId: string, updates: any, action: string = 'update') => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('milestone_update', {
        milestoneId,
        projectId,
        updates,
        action
      });
    }
  }, [isConnected]);

  // Send typing indicator
  const startTyping = useCallback((projectId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing_start', { projectId });
    }
  }, [isConnected]);

  // Stop typing indicator
  const stopTyping = useCallback((projectId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing_stop', { projectId });
    }
  }, [isConnected]);

  // Subscribe to specific events
  const on = useCallback(<T extends keyof SocketEvents>(event: T, handler: SocketEvents[T]) => {
    if (socketRef.current) {
      socketRef.current.on(event as string, handler);
    }
  }, []);

  // Unsubscribe from specific events
  const off = useCallback(<T extends keyof SocketEvents>(event: T, handler?: SocketEvents[T]) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event as string, handler);
      } else {
        socketRef.current.off(event as string);
      }
    }
  }, []);

  // Get socket instance for custom events
  const getSocket = useCallback(() => {
    return socketRef.current;
  }, []);

  return {
    // Connection state
    socket: socketRef.current,
    isConnected,
    connectionError,
    joinedProjects: Array.from(joinedProjects),
    
    // Project management
    joinProject,
    leaveProject,
    
    // Communication
    sendMessage,
    startTyping,
    stopTyping,
    
    // Real-time updates
    updateTask,
    updateMilestone,
    
    // Event handling
    on,
    off,
    getSocket,
  };
}

// Hook for project-specific socket events
export function useProjectSocket(projectId: string) {
  const socket = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const hasJoinedRef = useRef(false);

  // Memoized event handlers
  const handleNewMessage = useCallback((data: any) => {
    if (data.projectId === projectId) {
      setMessages(prev => [...prev, data]);
    }
  }, [projectId]);

  const handleUserTyping = useCallback((data: any) => {
    if (data.projectId === projectId) {
      setTypingUsers(prev => {
        const exists = prev.find(user => user.userId === data.userId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    }
  }, [projectId]);

  const handleUserStoppedTyping = useCallback((data: any) => {
    if (data.projectId === projectId) {
      setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
    }
  }, [projectId]);

  const handleUserJoined = useCallback((data: any) => {
    setOnlineUsers(prev => {
      const exists = prev.find(user => user.userId === data.userId);
      if (!exists) {
        return [...prev, data];
      }
      return prev;
    });
  }, []);

  const handleUserLeft = useCallback((data: any) => {
    setOnlineUsers(prev => prev.filter(user => user.userId !== data.userId));
  }, []);

  // Auto-join project on mount
  useEffect(() => {
    if (socket.isConnected && projectId && !hasJoinedRef.current) {
      hasJoinedRef.current = true;
      socket.joinProject(projectId);
    }
    
    return () => {
      if (hasJoinedRef.current) {
        hasJoinedRef.current = false;
        socket.leaveProject(projectId);
      }
    };
  }, [socket.isConnected, projectId]);

  // Handle project-specific events
  useEffect(() => {
    if (!socket.socket) return;

    // Subscribe to events
    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('user_joined_project', handleUserJoined);
    socket.on('user_left_project', handleUserLeft);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.off('user_joined_project', handleUserJoined);
      socket.off('user_left_project', handleUserLeft);
    };
  }, [
    socket.socket,
    handleNewMessage,
    handleUserTyping,
    handleUserStoppedTyping,
    handleUserJoined,
    handleUserLeft
  ]);

  // Clear typing indicator timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTypingUsers([]);
    }, 5000); // Clear typing indicators after 5 seconds

    return () => clearTimeout(timeout);
  }, [typingUsers]);

  return {
    ...socket,
    messages,
    typingUsers,
    onlineUsers,
    setMessages, // Allow manual message management
  };
}