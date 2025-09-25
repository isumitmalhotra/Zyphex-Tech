import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Mock notifications data
    const mockNotifications = [
      {
        id: "1",
        title: "Project Status Update",
        message: "Your e-commerce website project has moved to the development phase",
        type: "project_update",
        read: false,
        createdAt: "2025-09-24T08:30:00Z",
        projectId: "1"
      },
      {
        id: "2",
        title: "New Message",
        message: "You have received a new message from the project manager",
        type: "message",
        read: false,
        createdAt: "2025-09-24T07:15:00Z"
      },
      {
        id: "3", 
        title: "Invoice Generated",
        message: "Invoice #INV-2025-003 has been generated for Mobile App Development",
        type: "billing",
        read: true,
        createdAt: "2025-09-23T16:20:00Z",
        projectId: "2"
      },
      {
        id: "4",
        title: "Appointment Confirmed", 
        message: "Your design review meeting has been confirmed for Oct 5, 2025",
        type: "appointment",
        read: true,
        createdAt: "2025-09-22T14:45:00Z"
      },
      {
        id: "5",
        title: "Document Uploaded",
        message: "New project requirements document has been uploaded",
        type: "document",
        read: true,
        createdAt: "2025-09-21T11:30:00Z",
        projectId: "1"
      }
    ]

    const unreadCount = mockNotifications.filter(n => !n.read).length

    return NextResponse.json({
      notifications: mockNotifications,
      unreadCount,
      success: true
    })

  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }

    // Mock notification update - in real app, you'd update the database
    return NextResponse.json({
      success: true,
      message: "Notification updated successfully"
    })

  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}