'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  Hash,
  Lock,
  Plus,
  Search,
  Send,
  Smile,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Users,
  Settings,
  Pin,
  Edit,
  Trash,
  Circle,
} from 'lucide-react'

interface Channel {
  id: string
  name: string
  description: string
  type: 'PUBLIC' | 'PRIVATE'
  memberCount: number
  unreadCount: number
  lastMessage?: {
    content: string
    createdAt: string
    sender: { name: string }
  }
}

interface Message {
  id: string
  content: string
  channelId: string
  senderId: string
  sender: {
    id: string
    name: string
    avatar: string | null
    status: 'ONLINE' | 'AWAY' | 'OFFLINE'
  }
  createdAt: string
  updatedAt: string | null
  reactions: Array<{ emoji: string; count: number; users: string[] }>
  attachments: Array<{ id: string; name: string; size: number; type: string; url: string }>
  mentions: string[]
  isEdited: boolean
  isDeleted: boolean
}

export default function TeamCommunicationPage() {
  const { data: session } = useSession()
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNewChannelModal, setShowNewChannelModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchChannels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id)
    }
  }, [selectedChannel])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/project-manager/communication/channels')
      const data = await response.json()
      setChannels(data.channels || [])
      if (data.channels?.length > 0 && !selectedChannel) {
        setSelectedChannel(data.channels[0])
      }
    } catch (error) {
      console.error('Error fetching channels:', error)
    }
  }

  const fetchMessages = async (channelId: string) => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/project-manager/communication/messages?channelId=${channelId}`
      )
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedChannel) return

    try {
      const response = await fetch('/api/project-manager/communication/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: selectedChannel.id,
          content: messageInput,
          mentions: [],
          attachments: [],
        }),
      })

      const data = await response.json()
      if (data.message) {
        setMessages([...messages, data.message])
        setMessageInput('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar - Channels */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        {/* Workspace Header */}
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Zyphex Team</h1>
          <p className="text-sm text-gray-400">Team Workspace</p>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-400 uppercase">Channels</h2>
              <button
                onClick={() => setShowNewChannelModal(true)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel)}
                  className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 transition-colors ${
                    selectedChannel?.id === channel.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {channel.type === 'PRIVATE' ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Hash className="w-4 h-4" />
                  )}
                  <span className="flex-1">{channel.name}</span>
                  {channel.unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                      {channel.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-400 uppercase">
                Direct Messages
              </h2>
              <button className="p-1 hover:bg-gray-700 rounded">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-500">No direct messages yet</p>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                {session?.user?.name?.[0] || 'U'}
              </div>
              <Circle className="w-3 h-3 absolute bottom-0 right-0 fill-green-500 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{session?.user?.name || 'User'}</p>
              <p className="text-xs text-gray-400">Online</p>
            </div>
            <button className="p-1 hover:bg-gray-700 rounded">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        {selectedChannel && (
          <div className="h-16 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between bg-white dark:bg-gray-800">
            <div>
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedChannel.name}
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedChannel.description} • {selectedChannel.memberCount} members
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <Video className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white dark:bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Hash className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Be the first to send a message in this channel</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const showDate =
                index === 0 ||
                formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt)

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <div className="px-4 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded group">
                    <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white flex-shrink-0">
                      {message.sender.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {message.sender.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.createdAt)}
                        </span>
                        {message.isEdited && (
                          <span className="text-xs text-gray-400">(edited)</span>
                        )}
                      </div>
                      <div className="text-gray-800 dark:text-gray-200 mt-1">
                        {message.content}
                      </div>
                      {message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded"
                            >
                              <Paperclip className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {attachment.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {message.reactions.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {message.reactions.map((reaction, idx) => (
                            <button
                              key={idx}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                              {reaction.emoji} {reaction.count}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <Smile className="w-4 h-4" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <Pin className="w-4 h-4" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-red-500">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {selectedChannel && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-end gap-2">
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus-within:border-blue-500">
                <div className="flex items-center gap-2 p-2 border-b border-gray-300 dark:border-gray-600">
                  <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                    <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                    <Smile className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder={`Message #${selectedChannel.name}`}
                  className="w-full p-3 bg-transparent resize-none focus:outline-none text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        )}
      </div>

      {/* Right Sidebar - Members (Optional) */}
      <div className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 hidden xl:block">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Members ({selectedChannel?.memberCount || 0})
        </h3>
        <div className="space-y-3">
          {[
            { name: 'Alice Johnson', status: 'ONLINE' },
            { name: 'Bob Smith', status: 'ONLINE' },
            { name: 'Carol Davis', status: 'AWAY' },
            { name: 'David Wilson', status: 'OFFLINE' },
          ].map((member, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-sm">
                  {member.name[0]}
                </div>
                <Circle
                  className={`w-2.5 h-2.5 absolute bottom-0 right-0 ${
                    member.status === 'ONLINE'
                      ? 'fill-green-500 text-green-500'
                      : member.status === 'AWAY'
                      ? 'fill-yellow-500 text-yellow-500'
                      : 'fill-gray-400 text-gray-400'
                  }`}
                />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{member.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* New Channel Modal */}
      {showNewChannelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New Channel
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., project-alpha"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="What's this channel about?"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="private" className="rounded" />
                <label htmlFor="private" className="text-sm text-gray-700 dark:text-gray-300">
                  Make this channel private
                </label>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowNewChannelModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create Channel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}