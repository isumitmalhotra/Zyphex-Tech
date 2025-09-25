import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user with their projects
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        projects: {
          include: {
            client: true,
          },
          orderBy: {
            updatedAt: 'desc'
          }
        },
        _count: {
          select: {
            projects: {
              where: {
                status: {
                  in: ['PLANNING', 'IN_PROGRESS', 'REVIEW']
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Calculate project statistics
    const activeProjects = user.projects.filter(p => 
      ['PLANNING', 'IN_PROGRESS', 'REVIEW'].includes(p.status)
    ).length

    const completedProjects = user.projects.filter(p => 
      p.status === 'COMPLETED'
    ).length

    // Mock data for features not yet implemented
    const dashboardData = {
      user: {
        id: user.id,
        name: user.name || 'User',
        email: user.email,
        image: user.image,
        role: user.role
      },
      stats: {
        activeProjects,
        completedProjects,
        messages: 0, // To be implemented with messaging system
        nextMeeting: null // To be implemented with calendar system
      },
      projects: user.projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        client: project.client.name,
        startDate: project.startDate,
        endDate: project.endDate,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        // Calculate mock progress based on status
        progress: project.status === 'COMPLETED' ? 100 :
                 project.status === 'REVIEW' ? 90 :
                 project.status === 'IN_PROGRESS' ? 60 :
                 project.status === 'PLANNING' ? 25 : 0,
        priority: 'Medium' // To be added to schema later
      })),
      recentActivity: [
        // Mock activity - to be replaced with real activity tracking
        {
          type: 'info',
          title: 'Welcome to your dashboard!',
          time: 'Just now',
          icon: 'CheckCircle',
          color: 'text-green-400'
        }
      ]
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}