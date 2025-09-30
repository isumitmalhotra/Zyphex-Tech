"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  UserPlus,
  Settings,
  Hash,
  Users,
  Bell,
  BellOff,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data for chat channels and messages
const channels = [
  {
    id: "general",
    name: "general",
    type: "channel",
    unread: 3,
    lastMessage: "Alice: The new feature is ready for review",
    lastTime: "10:30 AM"
  },
  {
    id: "ecommerce",
    name: "ecommerce-project", 
    type: "channel",
    unread: 1,
    lastMessage: "Bob: Updated the product catalog API",
    lastTime: "9:45 AM"
  },
  {
    id: "mobile",
    name: "mobile-dev",
    type: "channel", 
    unread: 0,
    lastMessage: "Carol: Testing completed successfully",
    lastTime: "Yesterday"
  }
]

const directMessages = [
  {
    id: "bob",
    name: "Bob Smith",
    status: "online",
    unread: 2,
    lastMessage: "Can you review my PR?",
    lastTime: "11:15 AM"
  },
  {
    id: "carol",
    name: "Carol Davis",
    status: "away",
    unread: 0,
    lastMessage: "Thanks for the help!",
    lastTime: "Yesterday"
  },
  {
    id: "lisa",
    name: "Lisa Brown",
    status: "offline",
    unread: 0,
    lastMessage: "The designs look great",
    lastTime: "2 days ago"
  }
]

const messages = [
  {
    id: "1",
    sender: "Bob Smith",
    content: "Hey team! I just pushed the latest changes to the authentication module.",
    time: "9:30 AM",
    avatar: "BS"
  },
  {
    id: "2",
    sender: "Alice Johnson",
    content: "Great work Bob! I&apos;ll test it out and let you know if I find any issues.",
    time: "9:32 AM",
    avatar: "AJ",
    isMe: true
  },
  {
    id: "3",
    sender: "Carol Davis", 
    content: "The mobile responsiveness looks much better now. Thanks for fixing those CSS issues!",
    time: "9:45 AM",
    avatar: "CD"
  },
  {
    id: "4",
    sender: "Bob Smith",
    content: "No problem! Also, I&apos;ve updated the API documentation. You can find it in the docs folder.",
    time: "10:00 AM", 
    avatar: "BS"
  },
  {
    id: "5",
    sender: "Alice Johnson",
    content: "Perfect timing! I was just about to ask for that. The new authentication flow is working perfectly on my end.",
    time: "10:15 AM",
    avatar: "AJ",
    isMe: true
  }
]

export default function TeamChatPage() {
  const [selectedChannel, setSelectedChannel] = useState("general")
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Send message logic would go here
      setNewMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-700 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600"
            />
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Channels
              </h3>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                    selectedChannel === channel.id 
                      ? "bg-blue-600/20 text-blue-400" 
                      : "hover:bg-gray-800 text-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <Hash className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{channel.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {channel.lastMessage}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className="text-xs text-muted-foreground">{channel.lastTime}</span>
                    {channel.unread > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-[20px] text-xs">
                        {channel.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Messages */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Direct Messages
              </h3>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {directMessages.map((dm) => (
                <div
                  key={dm.id}
                  onClick={() => setSelectedChannel(dm.id)}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                    selectedChannel === dm.id 
                      ? "bg-blue-600/20 text-blue-400" 
                      : "hover:bg-gray-800 text-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className="relative">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {dm.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-gray-900 ${
                        dm.status === 'online' ? 'bg-green-500' :
                        dm.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{dm.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {dm.lastMessage}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className="text-xs text-muted-foreground">{dm.lastTime}</span>
                    {dm.unread > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-[20px] text-xs">
                        {dm.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Hash className="h-5 w-5 text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">
                {channels.find(c => c.id === selectedChannel)?.name || 
                 directMessages.find(dm => dm.id === selectedChannel)?.name || 
                 selectedChannel}
              </h2>
              <p className="text-sm text-muted-foreground">
                <Users className="h-4 w-4 inline mr-1" />
                5 members
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost">
              <Phone className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <Video className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <Bell className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Channel Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BellOff className="h-4 w-4 mr-2" />
                  Mute Notifications
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Members
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-sm">
                  {message.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-semibold ${
                    message.isMe ? 'text-blue-400' : 'text-white'
                  }`}>
                    {message.sender}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {message.time}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mt-1">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Input
                placeholder={`Message #${selectedChannel}`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-gray-800 border-gray-600 resize-none"
              />
            </div>
            <Button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}