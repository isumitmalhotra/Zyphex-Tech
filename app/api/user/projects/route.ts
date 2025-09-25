import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Create a new project request
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, budget, timeline, requirements } = await req.json()

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 })
    }

    // Find or create a default client for project requests
    let client = await prisma.client.findFirst({
      where: { email: session.user.email! }
    })

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: session.user.name || "Client",
          email: session.user.email!,
        }
      })
    }

    // Create the project with PLANNING status (pending admin approval)
    const project = await prisma.project.create({
      data: {
        name,
        description: `${description}\n\nRequirements: ${requirements || 'Not specified'}\nTimeline: ${timeline || 'Flexible'}`,
        status: "PLANNING", // Will be reviewed by admin
        budget: budget ? parseFloat(budget) : null,
        clientId: client.id,
        users: {
          connect: [{ id: session.user.id }]
        }
      },
      include: {
        client: true,
        users: true
      }
    })

    return NextResponse.json({ 
      message: "Project request submitted successfully",
      project 
    })
  } catch (error) {
    console.error("Project request error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Get user's project requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: {
        users: {
          some: {
            id: session.user.id
          }
        }
      },
      include: {
        client: true,
        users: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Fetch projects error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}