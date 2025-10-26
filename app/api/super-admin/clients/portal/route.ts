import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET() {
  try {
    // Fetch clients with their related data
    const clients = await prisma.client.findMany({
      where: {
        deletedAt: null
      },
      include: {
        projects: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        invoices: {
          select: {
            id: true,
            status: true
          }
        },
        contactLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            createdAt: true
          }
        },
        _count: {
          select: {
            projects: true,
            invoices: true,
            contactLogs: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get users with CLIENT role for portal access
    const clientUsers = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        deletedAt: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    // Format response
    const formattedClients = clients.map((client: any) => {
      const lastContact = client.contactLogs[0]?.createdAt || null
      const activeProjects = client.projects.filter((p: any) => p.status === 'IN_PROGRESS').length
      const clientUser = clientUsers.find((u: any) => u.email === client.email)

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        company: client.company || client.name,
        phone: client.phone,
        website: client.website,
        portalEnabled: !!clientUser,
        username: clientUser?.email?.split('@')[0] || null,
        lastLogin: clientUser ? new Date(clientUser.createdAt).toISOString() : null,
        projects: client._count.projects,
        activeProjects: activeProjects,
        documents: 0, // Would need Document model relation
        messages: 0, // Would need Message model relation
        totalUsers: clientUser ? 1 : 0,
        activeUsers: clientUser ? 1 : 0,
        customBranding: false,
        customDomain: null,
        theme: 'Default',
        logo: client.name.substring(0, 2).toUpperCase(),
        features: {
          projects: true,
          documents: true,
          messaging: true,
          analytics: false,
          invoices: true,
          timeTracking: false
        },
        permissions: {
          viewProjects: true,
          downloadDocuments: true,
          uploadDocuments: false,
          createTasks: false,
          viewTeam: true,
          viewBudget: false
        },
        analytics: {
          pageViews: 0,
          avgSessionDuration: '0m',
          topPage: 'Dashboard',
          engagement: 0
        },
        createdDate: client.createdAt.toISOString(),
        lastUpdated: client.updatedAt.toISOString(),
        lastContact: lastContact ? lastContact.toISOString() : null,
        invoiceCount: client._count.invoices,
        contactLogCount: client._count.contactLogs
      }
    })

    // Calculate stats
    const stats = {
      totalClients: formattedClients.length,
      activePortals: formattedClients.filter((c: any) => c.portalEnabled).length,
      inactivePortals: formattedClients.filter((c: any) => !c.portalEnabled).length,
      customBranded: formattedClients.filter((c: any) => c.customBranding).length,
      totalProjects: formattedClients.reduce((sum: number, c: any) => sum + c.projects, 0),
      totalDocuments: formattedClients.reduce((sum: number, c: any) => sum + c.documents, 0),
      totalMessages: formattedClients.reduce((sum: number, c: any) => sum + c.messages, 0),
      avgProjectsPerClient: formattedClients.length > 0 
        ? (formattedClients.reduce((sum: number, c: any) => sum + c.projects, 0) / formattedClients.length).toFixed(1)
        : '0'
    }

    return NextResponse.json({
      success: true,
      clients: formattedClients,
      stats
    })
  } catch (error) {
    console.error('Error fetching client portal data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch client portal data'
      },
      { status: 500 }
    )
  }
}
