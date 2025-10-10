/**
 * MessageThread Component
 * Displays messages in a channel with typing indicators
 */

"use client"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Message, Channel } from './types'
import { generateAvatar } from '@/lib/utils/avatar'
import { format, isToday, isYesterday } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

interface MessageThreadProps {
  channel: Channel | null
  messages: Message[]
  typingUsers: string[]
  messagesEndRef: React.RefObject<HTMLDivElement>
  loading?: boolean
}

export function MessageThread({
  channel,
  messages,
  typingUsers,
  messagesEndRef,
  loading = false
}: MessageThreadProps) {
  const { data: session } = useSession()

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return format(date, 'h:mm a')
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`
    } else {
      return format(date, 'MMM d, h:mm a')
    }
  }

  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return 'Today'
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'EEEE, MMMM d, yyyy')
    }
  }

  const shouldShowDateSeparator = (currentMsg: Message, previousMsg?: Message) => {
    if (!previousMsg) return true
    const currentDate = new Date(currentMsg.createdAt).toDateString()
    const previousDate = new Date(previousMsg.createdAt).toDateString()
    return currentDate !== previousDate
  }

  const isOwnMessage = (message: Message) => {
    return message.sender.id === session?.user?.id
  }

  if (!channel) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No conversation selected</p>
          <p className="text-sm">Choose a channel or start a direct message</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message, index) => {
          const showDateSeparator = shouldShowDateSeparator(message, messages[index - 1])
          const isOwn = isOwnMessage(message)

          return (
            <div key={message.id}>
              {showDateSeparator && (
                <div className="my-4 flex items-center justify-center">
                  <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    {formatDateSeparator(message.createdAt)}
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "flex gap-3",
                  isOwn && "flex-row-reverse"
                )}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={message.sender.image || generateAvatar(message.sender.name || message.sender.email)} 
                  />
                  <AvatarFallback>
                    {message.sender.name?.[0] || message.sender.email[0]}
                  </AvatarFallback>
                </Avatar>

                <div className={cn("flex-1 space-y-1", isOwn && "items-end")}>
                  <div className={cn("flex items-center gap-2", isOwn && "flex-row-reverse")}>
                    <span className="font-semibold text-sm">
                      {isOwn ? 'You' : (message.sender.name || message.sender.email)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatMessageTime(message.createdAt)}
                    </span>
                    {message.sender.role === 'SUPER_ADMIN' || message.sender.role === 'ADMIN' ? (
                      <Badge variant="destructive" className="text-xs">
                        Admin
                      </Badge>
                    ) : message.sender.role === 'PROJECT_MANAGER' ? (
                      <Badge variant="default" className="text-xs">
                        PM
                      </Badge>
                    ) : null}
                  </div>

                  <div
                    className={cn(
                      "inline-block rounded-lg px-4 py-2",
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.parent && (
                      <div className="mb-2 border-l-2 border-muted-foreground/30 pl-2 text-xs opacity-70">
                        <p className="font-semibold">{message.parent.sender.name}</p>
                        <p className="line-clamp-2">{message.parent.content}</p>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>

                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex gap-1">
                      {message.reactions.map(reaction => (
                        <Badge
                          key={reaction.id}
                          variant="outline"
                          className="cursor-pointer text-xs"
                        >
                          {reaction.emoji} {reaction.user.name?.[0]}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {message.replyCount && message.replyCount > 0 && (
                    <button className="text-xs text-primary hover:underline">
                      {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }} />
            </div>
            <span>
              {typingUsers.length === 1
                ? 'Someone is typing...'
                : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}
