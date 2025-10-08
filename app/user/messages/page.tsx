"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  MessageSquare,
  Send,
  Plus,
  User,
  Clock,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

interface Message {
  id: string
  subject: string
  content: string
  from: {
    name: string
    email: string
  }
  read: boolean
  createdAt: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [selectedRecipient, setSelectedRecipient] = useState("support@zyphextech.com")

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/messages")
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

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error("Please enter a message")
      return
    }

    try {
      setSending(true)
      const response = await fetch("/api/user/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
          recipientEmail: selectedRecipient,
          subject: "Message from User Dashboard"
        }),
      })

      if (response.ok) {
        toast.success("Message sent successfully!")
        setNewMessage("")
        fetchMessages()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to send message")
      }
    } catch (error) {
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold zyphex-heading">Messages</h1>
          <p className="text-muted-foreground mt-2">
            Communicate with the ZyphexTech team about your projects
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="zyphex-button">
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Send New Message</DialogTitle>
              <DialogDescription>
                Send a message to the ZyphexTech team about your project or inquiry.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">To:</label>
                <Input
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  placeholder="support@zyphextech.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message:</label>
                <Textarea
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                />
              </div>
              <Button 
                onClick={sendMessage} 
                disabled={sending || !newMessage.trim()}
                className="w-full zyphex-button"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {messages.length === 0 ? (
        <Card className="zyphex-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start a conversation with the ZyphexTech team about your projects.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="zyphex-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Send First Message
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Send New Message</DialogTitle>
                  <DialogDescription>
                    Send a message to the ZyphexTech team about your project or inquiry.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To:</label>
                    <Input
                      value={selectedRecipient}
                      onChange={(e) => setSelectedRecipient(e.target.value)}
                      placeholder="support@zyphextech.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message:</label>
                    <Textarea
                      placeholder="Type your message here..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={sendMessage} 
                    disabled={sending || !newMessage.trim()}
                    className="w-full zyphex-button"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {messages.map((message) => (
            <Card key={message.id} className="zyphex-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {message.from?.name || message.from?.email || "Unknown Sender"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        From: {message.from?.email || "Unknown Email"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!message.read && (
                      <Badge variant="secondary">Unread</Badge>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(message.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-2 text-base">{message.subject || 'No Subject'}</h3>
                <p className="text-sm leading-relaxed">{message.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
