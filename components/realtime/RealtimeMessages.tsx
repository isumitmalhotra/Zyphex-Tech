"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useProjectSocket } from '@/hooks/useSocket';
import { useSession } from 'next-auth/react';
import { Send, Users, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

interface RealtimeMessagesProps {
  projectId: string;
  projectName?: string;
  className?: string;
  maxHeight?: string;
}

export function RealtimeMessages({ projectId, projectName, className, maxHeight }: RealtimeMessagesProps) {
  const { data: session } = useSession();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const {
    isConnected,
    messages,
    typingUsers,
    onlineUsers,
    sendMessage,
    startTyping,
    stopTyping,
    setMessages
  } = useProjectSocket(projectId);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial messages from API
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/project-manager/projects/${projectId}/messages`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        // Error loading messages
      }
    };

    if (projectId) {
      loadMessages();
    }
  }, [projectId, setMessages]);

  // Handle sending messages
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isConnected) return;

    sendMessage(projectId, newMessage.trim());
    setNewMessage('');
    handleStopTyping();
  };

  // Handle typing indicators
  const handleStartTyping = () => {
    if (!isTyping && isConnected) {
      setIsTyping(true);
      startTyping(projectId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (isTyping && isConnected) {
      setIsTyping(false);
      stopTyping(projectId);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleStartTyping();
  };

  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch {
      return '';
    }
  };

  // Check if message is from current user
  const isOwnMessage = (senderId: string) => {
    return senderId === session?.user?.id;
  };

  // Get typing users excluding current user
  const otherTypingUsers = typingUsers.filter(user => user.userId !== session?.user?.id);

  return (
    <Card className={`${maxHeight || 'h-[600px]'} flex flex-col zyphex-card ${className || ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 zyphex-heading">
            <MessageCircle className="h-5 w-5" />
            Project Chat
            {projectName && <span className="text-sm zyphex-subheading">- {projectName}</span>}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Connection status */}
            <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            
            {/* Online users count */}
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Users className="h-3 w-3" />
              {onlineUsers.length}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 space-y-4">
        {/* Messages area */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto zyphex-subheading mb-2" />
                <p className="zyphex-subheading">No messages yet</p>
                <p className="text-sm zyphex-subheading">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage(message.sender?.id) ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      isOwnMessage(message.sender?.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 zyphex-text'
                    }`}
                  >
                    {!isOwnMessage(message.sender?.id) && (
                      <div className="text-xs opacity-70 mb-1">
                        {message.sender?.name || 'Unknown User'}
                      </div>
                    )}
                    <div className="text-sm">{message.content}</div>
                    <div className={`text-xs mt-1 ${isOwnMessage(message.sender?.id) ? 'text-blue-100' : 'text-slate-400'}`}>
                      {formatMessageTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Typing indicators */}
            {otherTypingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-slate-700 p-2 rounded-lg">
                  <div className="text-xs zyphex-subheading">
                    {otherTypingUsers.map(user => user.userName).join(', ')} 
                    {otherTypingUsers.length === 1 ? ' is' : ' are'} typing
                    <span className="typing-dots">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={handleInputChange}
            placeholder={isConnected ? "Type your message..." : "Connecting..."}
            disabled={!isConnected}
            className="flex-1 zyphex-input"
            onBlur={handleStopTyping}
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || !isConnected}
            className="zyphex-button"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Online users list */}
        {onlineUsers.length > 0 && (
          <div className="border-t border-slate-700 pt-2">
            <div className="text-xs zyphex-subheading mb-1">Online now:</div>
            <div className="flex flex-wrap gap-1">
              {onlineUsers.map((user) => (
                <Badge key={user.userId} variant="outline" className="text-xs">
                  {user.userName}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <style jsx>{`
        .typing-dots span {
          animation: typing 1.4s infinite;
        }
        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.3;
          }
          30% {
            opacity: 1;
          }
        }
      `}</style>
    </Card>
  );
}