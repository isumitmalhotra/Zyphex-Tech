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

    // For now, return mock appointments data
    // In a real implementation, you'd have an Appointment model
    const mockAppointments = [
      {
        id: "1",
        title: "Project Kickoff Meeting",
        description: "Initial discussion about the e-commerce project requirements and timeline",
        date: "2025-09-30",
        time: "10:00",
        type: "video",
        status: "confirmed",
        with: "Project Manager",
        createdAt: new Date().toISOString()
      },
      {
        id: "2", 
        title: "Design Review",
        description: "Review and feedback on the initial design mockups",
        date: "2025-10-05",
        time: "14:00",
        type: "video",
        status: "pending",
        with: "Design Team",
        createdAt: new Date().toISOString()
      }
    ]

    return NextResponse.json({
      appointments: mockAppointments,
      success: true
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, date, time, type } = await request.json()

    if (!title?.trim() || !date || !time) {
      return NextResponse.json({ error: "Title, date, and time are required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Mock appointment creation - in real app, you'd save to database
    const newAppointment = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description?.trim() || "",
      date,
      time,
      type: type || "video",
      status: "pending",
      with: "Zyphex Team",
      userId: user.id,
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({
      appointment: newAppointment,
      success: true
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}