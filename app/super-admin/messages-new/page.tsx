"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MessageSquare,
  Send,
  User,
  Clock,
  Loader2,
  ArrowLeft,
  Mail,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { generateAvatar } from "@/lib/utils/avatar"

interface Message {
  id: string
  subject: string
  content: string
  sender: {
    id: string
    name: string | null
    email: string
    image: string | null
    role: string
  }
  receiver: {
    id: string
    name: string | null
    email: string
    image: string | null
    role: string
  }
  read: boolean
  readAt: Date | null
  createdAt: string
  projectId?: string | null
  replies?: Message[]
}

function AdminMessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const messageId = searchParams.get("id")
  
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [replyText, setReplyText] = useState("")

  useEffect(() => {
    fetchMessages()
  }, [])

  useEffect(() => {
    if (messageId && messages.length > 0) {
      const message = messages.find((m) => m.id === messageId)
      if (message) {
        setSelectedMessage(message)
        if (!message.read) {
          markAsRead(message.id)
        }
      }
    }
  }, [messageId, messages])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/super-admin/messages")
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      } else {
        toast.error("Failed to load messages")
      }
    } catch (error) {
      toast.error("Failed to load messages")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/super-admin/messages/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ read: true }),
      })
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id ? { ...msg, read: true, readAt: new Date() } : msg
        )
      )
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  const sendReply = async () => {
    if (!replyText.trim() || !selectedMessage) {
      toast.error("Please enter a reply message")
      return
    }

    try {
      setSending(true)
      const response = await fetch("/api/super-admin/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyText,
          recipientId: selectedMessage.sender.id,
          subject: `Re: ${selectedMessage.subject}`,
          parentId: selectedMessage.id,
        }),
      })

      if (response.ok) {
        toast.success("Reply sent successfully!")
        setReplyText("")
        fetchMessages()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to send reply")
      }
    } catch (error) {
      toast.error("Failed to send reply")
    } finally {
      setSending(false)
    }
  }

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message)
    router.push(`/super-admin/messages?id=${message.id}`)
    if (!message.read) {
      markAsRead(message.id)
    }
  }

  const handleBack = () => {
    setSelectedMessage(null)
    router.push("/super-admin/messages")
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            <span className="zyphex-subheading">Loading messages...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show message detail view
  if (selectedMessage) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Messages
          </Button>

          {/* Message Detail */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={
                        selectedMessage.sender.image ||
                        generateAvatar(selectedMessage.sender.name || selectedMessage.sender.email, 48)
                      }
                    />
                    <AvatarFallback>
                      {(selectedMessage.sender.name || selectedMessage.sender.email)
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold zyphex-heading">
                      {selectedMessage.sender.name || selectedMessage.sender.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMessage.sender.email}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {selectedMessage.sender.role}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {format(new Date(selectedMessage.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2 zyphex-heading">
                  {selectedMessage.subject}
                </h3>
                <p className="text-sm leading-relaxed zyphex-subheading whitespace-pre-wrap">
                  {selectedMessage.content}
                </p>
              </div>

              {/* Replies */}
              {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                <div className="space-y-3 mt-6 pt-6 border-t">
                  <h4 className="font-semibold zyphex-heading">Replies</h4>
                  {selectedMessage.replies.map((reply) => (
                    <Card key={reply.id} className="zyphex-card">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={
                                reply.sender.image ||
                                generateAvatar(reply.sender.name || reply.sender.email, 32)
                              }
                            />
                            <AvatarFallback>
                              {(reply.sender.name || reply.sender.email)
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm">
                                {reply.sender.name || reply.sender.email}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(reply.createdAt), "MMM d, h:mm a")}
                              </span>
                            </div>
                            <p className="text-sm zyphex-subheading whitespace-pre-wrap">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reply Form */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="text-lg">Send Reply</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button onClick={sendReply} disabled={sending || !replyText.trim()}>
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show messages list
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-blue-400" />
              Messages
            </h1>
            <p className="zyphex-subheading">
              User messages and communications • {messages.filter((m) => !m.read).length} unread
            </p>
          </div>
        </div>

        {/* Messages List */}
        <div className="space-y-3">
          {messages.length === 0 ? (
            <Card className="zyphex-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">No messages yet</p>
              </CardContent>
            </Card>
          ) : (
            messages.map((message) => (
              <Card
                key={message.id}
                className={`zyphex-card cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg ${
                  !message.read ? "border-blue-500/30 bg-blue-500/5" : ""
                }`}
                onClick={() => handleMessageClick(message)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={
                          message.sender.image ||
                          generateAvatar(message.sender.name || message.sender.email, 40)
                        }
                      />
                      <AvatarFallback>
                        {(message.sender.name || message.sender.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold zyphex-heading">
                            {message.sender.name || message.sender.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {message.sender.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!message.read && (
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-medium text-sm zyphex-heading mt-1">
                        {message.subject}
                      </h3>
                      <p className="text-sm zyphex-subheading line-clamp-2">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{message.sender.role}</Badge>
                        {message.replies && message.replies.length > 0 && (
                          <Badge variant="secondary">
                            {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            <span className="zyphex-subheading">Loading messages...</span>
          </div>
        </div>
      </div>
    }>
      <AdminMessagesContent />
    </Suspense>
  )
}
