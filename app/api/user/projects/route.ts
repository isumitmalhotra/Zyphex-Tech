import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for project creation
const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(255, "Project name too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
  budget: z.number().positive("Budget must be positive").optional(),
  timeline: z.string().optional(),
  requirements: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional()
})

// Create a new project request
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request body
    const rawBody = await req.json()
    const validationResult = createProjectSchema.safeParse(rawBody)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationResult.error.format() 
      }, { status: 400 })
    }

    const { name, description, budget, timeline, requirements, priority } = validationResult.data

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

    // Build project description with additional details
    let projectDescription = description
    if (requirements) {
      projectDescription += `\n\nRequirements: ${requirements}`
    }
    if (timeline) {
      projectDescription += `\nTimeline: ${timeline}`
    }

    // Create the project with PLANNING status (pending admin approval)
    const project = await prisma.project.create({
      data: {
        name,
        description: projectDescription,
        status: "PLANNING", // Will be reviewed by admin
        priority: priority || "MEDIUM",
        budget: budget || 0,
        hourlyRate: 0, // Will be set by admin
        clientId: client.id,
        users: {
          connect: [{ id: session.user.id }]
        }
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        _count: {
          select: {
            tasks: true,
            timeEntries: true,
            documents: true
          }
        }
      }
    })

    // Log the project creation activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'PROJECT',
        entityId: project.id,
        changes: JSON.stringify({ 
          projectName: name,
          status: 'PLANNING'
        })
      }
    })

    return NextResponse.json({ 
      message: "Project request submitted successfully",
      project: {
        ...project,
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          totalHours: 0,
          totalDocuments: 0,
          totalTimeEntries: 0,
          completionRate: 0
        }
      }
    })
  } catch (error: any) {
    console.error("Project request error:", error)
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A project with this name already exists" },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Get user's project requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build where conditions
    const whereConditions: any = {
      OR: [
        { users: { some: { id: session.user.id } } },
        { managerId: session.user.id },
        { client: { email: session.user.email } }
      ]
    }

    if (status) {
      whereConditions.status = status.toUpperCase()
    }

    if (search) {
      whereConditions.AND = [
        whereConditions.OR ? { OR: whereConditions.OR } : {},
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
      delete whereConditions.OR
    }

    const projects = await prisma.project.findMany({
      where: whereConditions,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true
          },
          orderBy: {
            updatedAt: 'desc'
          },
          take: 5
        },
        _count: {
          select: {
            tasks: true,
            timeEntries: true,
            documents: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Calculate additional statistics for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const [completedTasks, totalHours, recentActivity] = await Promise.all([
          prisma.task.count({
            where: {
              projectId: project.id,
              status: 'DONE'
            }
          }),
          prisma.timeEntry.aggregate({
            where: { projectId: project.id },
            _sum: { hours: true }
          }),
          prisma.activityLog.findFirst({
            where: {
              entityType: 'PROJECT',
              entityId: project.id
            },
            orderBy: { createdAt: 'desc' }
          })
        ])

        return {
          ...project,
          stats: {
            totalTasks: project._count.tasks,
            completedTasks,
            totalHours: Number(totalHours._sum?.hours || 0),
            totalDocuments: project._count.documents,
            totalTimeEntries: project._count.timeEntries,
            completionRate: project._count.tasks > 0 
              ? Math.round((completedTasks / project._count.tasks) * 100)
              : 0,
            lastActivity: recentActivity?.createdAt
          }
        }
      })
    )

    return NextResponse.json({ 
      projects: projectsWithStats,
      summary: {
        total: projectsWithStats.length,
        active: projectsWithStats.filter(p => ['PLANNING', 'IN_PROGRESS', 'REVIEW'].includes(p.status)).length,
        completed: projectsWithStats.filter(p => p.status === 'COMPLETED').length
      }
    })
  } catch (error) {
    console.error("Fetch projects error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}