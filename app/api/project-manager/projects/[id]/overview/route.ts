import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TaskStatus } from "@prisma/client"
import { differenceInDays } from "date-fns"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user with role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })

    if (!user || user.role !== "PROJECT_MANAGER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Fetch comprehensive project data
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        OR: [
          { managerId: user.id },
          { users: { some: { id: user.id } } }
        ]
      },
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
            dueDate: true
          }
        },
        milestones: {
          select: {
            id: true,
            status: true
          }
        },
        users: {
          select: {
            id: true,
            name: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Calculate task statistics
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter(task => task.status === TaskStatus.DONE).length
    const inProgressTasks = project.tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length
    const overdueTasks = project.tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE
    ).length

    // Calculate milestone statistics
    const totalMilestones = project.milestones.length
    const completedMilestones = project.milestones.filter(milestone => milestone.status === 'COMPLETED').length
    const atRiskMilestones = project.milestones.filter(milestone => 
      milestone.status === 'DELAYED' || milestone.status === 'CANCELLED'
    ).length

    // Calculate timeline progress
    let timelineProgress = 0
    let daysRemaining = 0
    let isOverdue = false

    if (project.startDate && project.endDate) {
      const totalDays = differenceInDays(new Date(project.endDate), new Date(project.startDate))
      const elapsedDays = differenceInDays(new Date(), new Date(project.startDate))
      timelineProgress = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100)
      daysRemaining = differenceInDays(new Date(project.endDate), new Date())
      isOverdue = daysRemaining < 0
    }

    // Calculate overall completion rate
    const taskCompletion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    const milestoneCompletion = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0
    const overallCompletion = totalTasks > 0 || totalMilestones > 0 
      ? Math.round((taskCompletion + milestoneCompletion) / 2)
      : 0

    const projectStats = {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      budgetUsed: project.budgetUsed,
      completionRate: overallCompletion,
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        overdue: overdueTasks
      },
      milestones: {
        total: totalMilestones,
        completed: completedMilestones,
        atRisk: atRiskMilestones
      },
      team: {
        total: project.users.length,
        manager: project.manager?.name || 'Unassigned'
      },
      timeline: {
        daysRemaining: Math.abs(daysRemaining),
        isOverdue,
        progress: Math.round(timelineProgress)
      }
    }

    return NextResponse.json({ project: projectStats })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}