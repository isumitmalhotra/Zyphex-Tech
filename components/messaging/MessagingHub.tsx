/**
 * MessagingHub Component
 * Main messaging interface - Slack-like design
 * 
 * Features:
 * - Real-time messaging with Socket.io
 * - Role-based channel visibility
 * - Direct messages
 * - Search functionality
 * - Typing indicators
 * - Unread badges
 * - Responsive design
 */

"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  Settings, 
  Users, 
  Hash,
  Wifi,
  WifiOff,
  X
} from 'lucide-react'
import { ChannelList } from './ChannelList'
import { MessageThread } from './MessageThread'
import { MessageInput } from './MessageInput'
import { SearchResults } from './SearchResults'
import { useMessaging } from '@/hooks/use-messaging'
import { ViewMode } from './types'
import { cn } from '@/lib/utils'

interface MessagingHubProps {
  className?: string
  compact?: boolean
  layout?: 'full' | 'compact'
}

export function MessagingHub({ className, compact = false, layout }: MessagingHubProps) {
  // Support both compact prop and layout prop for flexibility
  const isCompact = layout === 'compact' || compact
  const [viewMode, setViewMode] = useState<ViewMode>('channels')
  const [showSearch, setShowSearch] = useState(false)

  const {
    channels,
    users,
    selectedChannel,
    messages,
    loading,
    sending,
    typingUsers,
    searchResults,
    searchQuery,
    isConnected,
    messagesEndRef,
    setSelectedChannel,
    setSearchQuery,
    fetchChannelMessages,
    sendMessage,
    openDirectMessage,
    search,
    handleTyping,
    refreshChannels
  } = useMessaging()

  // Handle search query changes
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setShowSearch(true)
      const debounce = setTimeout(() => {
        search(searchQuery)
      }, 300)
      return () => clearTimeout(debounce)
    } else {
      setShowSearch(false)
    }
  }, [searchQuery, search])

  // Handle channel selection
  const handleChannelSelect = async (channel: any) => {
    setSelectedChannel(channel)
    await fetchChannelMessages(channel.id)
    setShowSearch(false)
    setSearchQuery('')
  }

  // Handle user selection (start DM)
  const handleUserSelect = async (userId: string, userName: string) => {
    const channel = await openDirectMessage(userId, userName)
    if (channel) {
      setShowSearch(false)
      setSearchQuery('')
    }
  }

  // Handle message send
  const handleSendMessage = async (content: string) => {
    if (!selectedChannel) return
    await sendMessage(content, selectedChannel.id)
  }

  // Handle typing
  const handleTypingChange = (content: string) => {
    if (selectedChannel) {
      handleTyping(content, selectedChannel.id)
    }
  }

  // Calculate total unread count
  const totalUnreadCount = channels.reduce((sum, channel) => sum + channel.unreadCount, 0)

  if (isCompact) {
    return (
      <Card className={cn("flex h-[500px] w-full overflow-hidden", className)}>
        <div className="flex w-64 flex-col border-r">
          <div className="flex items-center justify-between border-b p-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span className="font-semibold">Messages</span>
            </div>
            {totalUnreadCount > 0 && (
              <Badge variant="destructive">{totalUnreadCount}</Badge>
            )}
          </div>
          <ChannelList
            channels={channels}
            users={users}
            selectedChannelId={selectedChannel?.id || null}
            viewMode={viewMode}
            searchQuery={searchQuery}
            onChannelSelect={handleChannelSelect}
            onUserSelect={handleUserSelect}
            onViewModeChange={setViewMode}
            onSearchChange={setSearchQuery}
          />
        </div>

        <div className="flex flex-1 flex-col">
          {selectedChannel && (
            <>
              <div className="flex items-center justify-between border-b p-3">
                <div className="flex items-center gap-2">
                  {selectedChannel.type === 'DIRECT' ? (
                    <Users className="h-4 w-4" />
                  ) : (
                    <Hash className="h-4 w-4" />
                  )}
                  <span className="font-semibold">{selectedChannel.name}</span>
                  {selectedChannel.description && (
                    <span className="text-sm text-muted-foreground">
                      • {selectedChannel.description}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>

              <MessageThread
                channel={selectedChannel}
                messages={messages}
                typingUsers={typingUsers}
                messagesEndRef={messagesEndRef}
                loading={loading}
              />

              <MessageInput
                channel={selectedChannel}
                sending={sending}
                onSend={handleSendMessage}
                onTyping={handleTypingChange}
              />
            </>
          )}

          {showSearch && searchResults && (
            <div className="absolute inset-0 z-50 bg-background">
              <div className="flex items-center justify-between border-b p-3">
                <span className="font-semibold">Search Results</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSearch(false)
                    setSearchQuery('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SearchResults
                results={searchResults}
                query={searchQuery}
                onChannelClick={handleChannelSelect}
                onUserClick={handleUserSelect}
              />
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className={cn("flex h-screen flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-background px-6 py-3">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-xl font-bold">Messages</h1>
          {totalUnreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {totalUnreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-red-600">Disconnected</span>
              </>
            )}
          </div>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r">
          <ChannelList
            channels={channels}
            users={users}
            selectedChannelId={selectedChannel?.id || null}
            viewMode={viewMode}
            searchQuery={searchQuery}
            onChannelSelect={handleChannelSelect}
            onUserSelect={handleUserSelect}
            onViewModeChange={setViewMode}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Message Area */}
        <div className="relative flex flex-1 flex-col">
          {selectedChannel ? (
            <>
              {/* Channel Header */}
              <div className="flex items-center justify-between border-b bg-background px-6 py-4">
                <div className="flex items-center gap-3">
                  {selectedChannel.type === 'DIRECT' ? (
                    <Users className="h-5 w-5" />
                  ) : (
                    <Hash className="h-5 w-5" />
                  )}
                  <div>
                    <h2 className="font-semibold">{selectedChannel.name}</h2>
                    {selectedChannel.description && (
                      <p className="text-sm text-muted-foreground">
                        {selectedChannel.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{selectedChannel.memberCount} members</span>
                </div>
              </div>

              {/* Messages */}
              <MessageThread
                channel={selectedChannel}
                messages={messages}
                typingUsers={typingUsers}
                messagesEndRef={messagesEndRef}
                loading={loading}
              />

              {/* Input */}
              <MessageInput
                channel={selectedChannel}
                sending={sending}
                onSend={handleSendMessage}
                onTyping={handleTypingChange}
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="mx-auto mb-4 h-16 w-16 opacity-50" />
                <h3 className="mb-2 text-lg font-semibold">Welcome to Messages</h3>
                <p className="text-sm">
                  Select a channel or start a direct message to begin
                </p>
              </div>
            </div>
          )}

          {/* Search Overlay */}
          {showSearch && searchResults && (
            <div className="absolute inset-0 z-50 bg-background">
              <div className="flex items-center justify-between border-b p-4">
                <h3 className="font-semibold">Search Results for "{searchQuery}"</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSearch(false)
                    setSearchQuery('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SearchResults
                results={searchResults}
                query={searchQuery}
                onChannelClick={handleChannelSelect}
                onUserClick={handleUserSelect}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
