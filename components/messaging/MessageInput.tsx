/**
 * MessageInput Component
 * Input area for composing and sending messages
 */

"use client"

import { useState, useRef, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Paperclip, Smile, Loader2 } from 'lucide-react'
import { Channel } from './types'

interface MessageInputProps {
  channel: Channel | null
  sending: boolean
  onSend: (content: string) => Promise<void>
  onTyping: (content: string) => void
}

export function MessageInput({
  channel,
  sending,
  onSend,
  onTyping
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    if (!message.trim() || sending || !channel) return

    const content = message
    setMessage('')
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    await onSend(content)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (value: string) => {
    setMessage(value)
    onTyping(value)
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  if (!channel) {
    return null
  }

  return (
    <div className="border-t bg-background p-4">
      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Textarea
            ref={textareaRef}
            placeholder={`Message ${channel.type === 'DIRECT' ? channel.members[0]?.name : `#${channel.name}`}...`}
            value={message}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="min-h-[44px] max-h-[200px] resize-none"
            rows={1}
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={sending}
                title="Add attachment (coming soon)"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={sending}
                title="Add emoji (coming soon)"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
        <Button
          onClick={handleSend}
          disabled={!message.trim() || sending}
          size="lg"
          className="self-start"
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  )
}
