/**
 * SearchResults Component
 * Displays search results for messages, channels, and users
 */

"use client"

import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  MessageSquare, 
  Hash, 
  User, 
  Search,
  Users,
  Shield,
  Briefcase
} from 'lucide-react'
import { SearchResults as SearchResultsType } from './types'
import { generateAvatar } from '@/lib/utils/avatar'
import { format } from 'date-fns'

interface SearchResultsProps {
  results: SearchResultsType
  query: string
  onChannelClick: (channel: any) => void
  onUserClick: (userId: string, userName: string) => void
}

export function SearchResults({
  results,
  query,
  onChannelClick,
  onUserClick
}: SearchResultsProps) {
  const hasResults =
    results.messages.length > 0 ||
    results.channels.length > 0 ||
    results.users.length > 0

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-900">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    )
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return <Shield className="h-3 w-3 text-red-500" />
      case 'PROJECT_MANAGER':
        return <Briefcase className="h-3 w-3 text-blue-500" />
      case 'TEAM_MEMBER':
        return <Users className="h-3 w-3 text-green-500" />
      default:
        return <User className="h-3 w-3 text-gray-500" />
    }
  }

  if (!hasResults) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Search className="mx-auto mb-4 h-16 w-16 opacity-50" />
          <p className="text-lg font-medium">No results found</p>
          <p className="text-sm">Try a different search term</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Messages */}
        {results.messages.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <h3 className="font-semibold">Messages</h3>
              <Badge variant="secondary">{results.messages.length}</Badge>
            </div>
            <div className="space-y-2">
              {results.messages.map(message => (
                <Button
                  key={message.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 text-left"
                  onClick={() => onChannelClick({ id: message.channel.id, name: message.channel.name })}
                >
                  <div className="flex gap-3 w-full">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage 
                        src={message.sender.image || generateAvatar(message.sender.name || message.sender.email)} 
                      />
                      <AvatarFallback>
                        {message.sender.name?.[0] || message.sender.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {message.sender.name || message.sender.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          in #{message.channel.name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(message.createdAt), 'MMM d')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {highlightText(message.content, query)}
                      </p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {results.messages.length > 0 && (results.channels.length > 0 || results.users.length > 0) && (
          <Separator />
        )}

        {/* Channels */}
        {results.channels.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <h3 className="font-semibold">Channels</h3>
              <Badge variant="secondary">{results.channels.length}</Badge>
            </div>
            <div className="space-y-2">
              {results.channels.map(channel => (
                <Button
                  key={channel.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 text-left"
                  onClick={() => onChannelClick(channel)}
                >
                  <div className="flex gap-3 w-full items-center">
                    <Hash className="h-5 w-5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {highlightText(channel.name, query)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {channel.channelType}
                        </Badge>
                        {channel.isPrivate && (
                          <Badge variant="secondary" className="text-xs">
                            Private
                          </Badge>
                        )}
                      </div>
                      {channel.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {highlightText(channel.description, query)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {channel.memberCount} members
                      </p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {results.channels.length > 0 && results.users.length > 0 && (
          <Separator />
        )}

        {/* Users */}
        {results.users.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              <h3 className="font-semibold">People</h3>
              <Badge variant="secondary">{results.users.length}</Badge>
            </div>
            <div className="space-y-2">
              {results.users.map(user => (
                <Button
                  key={user.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 text-left"
                  onClick={() => onUserClick(user.id, user.name || user.email)}
                >
                  <div className="flex gap-3 w-full items-center">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage 
                        src={user.image || generateAvatar(user.name || user.email)} 
                      />
                      <AvatarFallback>
                        {user.name?.[0] || user.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {highlightText(user.name || user.email, query)}
                        </span>
                        {getRoleIcon(user.role)}
                      </div>
                      {user.name && (
                        <p className="text-sm text-muted-foreground truncate">
                          {highlightText(user.email, query)}
                        </p>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
