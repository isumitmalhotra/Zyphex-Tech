import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch resource allocations with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization
    const userRole = session.user.role;
    if (!["PROJECT_MANAGER", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId");
    const isActive = searchParams.get("isActive");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    // Date range filter
    if (startDate || endDate) {
      where.OR = [];
      
      // Resource allocation overlaps with query date range
      if (startDate && endDate) {
        where.OR.push({
          AND: [
            { startDate: { lte: new Date(endDate) } },
            {
              OR: [
                { endDate: { gte: new Date(startDate) } },
                { endDate: null }, // Ongoing allocations
              ],
            },
          ],
        });
      } else if (startDate) {
        where.OR.push({
          OR: [
            { endDate: { gte: new Date(startDate) } },
            { endDate: null },
          ],
        });
      } else if (endDate) {
        where.OR.push({
          startDate: { lte: new Date(endDate) },
        });
      }
    }

    // Fetch resource allocations
    const resources = await prisma.resourceAllocation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            targetEndDate: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ startDate: "desc" }],
    });

    // Calculate statistics
    const totalAllocations = resources.length;
    const activeAllocations = resources.filter((r) => r.isActive).length;
    const inactiveAllocations = totalAllocations - activeAllocations;

    // Calculate total allocation percentage (sum of all active allocations)
    const totalAllocationPercentage = resources
      .filter((r) => r.isActive)
      .reduce((sum, r) => sum + r.allocationPercentage, 0);

    // Calculate average allocation percentage
    const avgAllocationPercentage = activeAllocations > 0 ? totalAllocationPercentage / activeAllocations : 0;

    // Get unique users and calculate their utilization
    const userUtilization = new Map<string, { 
      userId: string; 
      userName: string; 
      totalAllocation: number; 
      projects: number;
      isOverallocated: boolean;
    }>();

    resources.filter((r) => r.isActive).forEach((resource) => {
      const existing = userUtilization.get(resource.userId);
      if (existing) {
        existing.totalAllocation += resource.allocationPercentage;
        existing.projects += 1;
        existing.isOverallocated = existing.totalAllocation > 100;
      } else {
        userUtilization.set(resource.userId, {
          userId: resource.userId,
          userName: resource.user.name || "Unknown",
          totalAllocation: resource.allocationPercentage,
          projects: 1,
          isOverallocated: resource.allocationPercentage > 100,
        });
      }
    });

    const utilizationData = Array.from(userUtilization.values());
    const overallocatedUsers = utilizationData.filter((u) => u.isOverallocated).length;
    const underutilizedUsers = utilizationData.filter((u) => u.totalAllocation < 50).length;
    const optimalUsers = utilizationData.filter((u) => u.totalAllocation >= 50 && u.totalAllocation <= 100).length;

    // Project resource statistics
    const projectResources = new Map<string, {
      projectId: string;
      projectName: string;
      totalAllocation: number;
      resourceCount: number;
      avgAllocation: number;
    }>();

    resources.filter((r) => r.isActive).forEach((resource) => {
      const existing = projectResources.get(resource.projectId);
      if (existing) {
        existing.totalAllocation += resource.allocationPercentage;
        existing.resourceCount += 1;
        existing.avgAllocation = existing.totalAllocation / existing.resourceCount;
      } else {
        projectResources.set(resource.projectId, {
          projectId: resource.projectId,
          projectName: resource.project.name,
          totalAllocation: resource.allocationPercentage,
          resourceCount: 1,
          avgAllocation: resource.allocationPercentage,
        });
      }
    });

    const projectResourceData = Array.from(projectResources.values());

    // Calculate total cost (if hourlyRate is available)
    const resourcesWithRates = resources.filter((r) => r.isActive && r.hourlyRate);
    const totalMonthlyRate = resourcesWithRates.reduce((sum, r) => {
      const hoursPerMonth = (r.allocationPercentage / 100) * 160; // Assuming 160 hours per month
      return sum + (r.hourlyRate || 0) * hoursPerMonth;
    }, 0);

    return NextResponse.json({
      resources,
      statistics: {
        total: totalAllocations,
        active: activeAllocations,
        inactive: inactiveAllocations,
        totalAllocationPercentage: Math.round(totalAllocationPercentage * 10) / 10,
        avgAllocationPercentage: Math.round(avgAllocationPercentage * 10) / 10,
        totalMonthlyRate: Math.round(totalMonthlyRate * 100) / 100,
        userUtilization: {
          overallocated: overallocatedUsers,
          optimal: optimalUsers,
          underutilized: underutilizedUsers,
          data: utilizationData,
        },
        projectResources: projectResourceData,
      },
    });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
  }
}

// POST - Create resource allocation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization
    const userRole = session.user.role;
    if (!["PROJECT_MANAGER", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { projectId, userId, role, allocationPercentage, hourlyRate, startDate, endDate, skills } = body;

    // Validation
    if (!projectId || !userId || allocationPercentage === undefined || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, userId, allocationPercentage, startDate" },
        { status: 400 }
      );
    }

    if (allocationPercentage < 0 || allocationPercentage > 100) {
      return NextResponse.json({ error: "Allocation percentage must be between 0 and 100" }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create resource allocation
    const resource = await prisma.resourceAllocation.create({
      data: {
        projectId,
        userId,
        role: role || null,
        allocationPercentage,
        hourlyRate: hourlyRate || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        skills: skills || null,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ resource, message: "Resource allocation created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error creating resource allocation:", error);
    
    // Handle unique constraint violation
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "A resource allocation already exists for this user, project, and start date" },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ error: "Failed to create resource allocation" }, { status: 500 });
  }
}

// PUT - Update resource allocation
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization
    const userRole = session.user.role;
    if (!["PROJECT_MANAGER", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, role, allocationPercentage, hourlyRate, startDate, endDate, isActive, skills } = body;

    // Validation
    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

    if (allocationPercentage !== undefined && (allocationPercentage < 0 || allocationPercentage > 100)) {
      return NextResponse.json({ error: "Allocation percentage must be between 0 and 100" }, { status: 400 });
    }

    // Verify resource allocation exists
    const existingResource = await prisma.resourceAllocation.findUnique({
      where: { id },
    });

    if (!existingResource) {
      return NextResponse.json({ error: "Resource allocation not found" }, { status: 404 });
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (role !== undefined) updateData.role = role;
    if (allocationPercentage !== undefined) updateData.allocationPercentage = allocationPercentage;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (skills !== undefined) updateData.skills = skills;

    // Update resource allocation
    const resource = await prisma.resourceAllocation.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ resource, message: "Resource allocation updated successfully" });
  } catch (error) {
    console.error("Error updating resource allocation:", error);
    return NextResponse.json({ error: "Failed to update resource allocation" }, { status: 500 });
  }
}

// DELETE - Delete resource allocation
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization
    const userRole = session.user.role;
    if (!["PROJECT_MANAGER", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing required parameter: id" }, { status: 400 });
    }

    // Verify resource allocation exists
    const resource = await prisma.resourceAllocation.findUnique({
      where: { id },
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource allocation not found" }, { status: 404 });
    }

    // Delete resource allocation
    await prisma.resourceAllocation.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Resource allocation deleted successfully" });
  } catch (error) {
    console.error("Error deleting resource allocation:", error);
    return NextResponse.json({ error: "Failed to delete resource allocation" }, { status: 500 });
  }
}
