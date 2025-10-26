import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow PROJECT_MANAGER and SUPER_ADMIN
    if (!["PROJECT_MANAGER", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || "";
    const category = searchParams.get("category") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    // Build where clause for filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (projectId && projectId !== "all") {
      where.projectId = projectId;
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Fetch expenses with relations
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            budget: true,
            budgetUsed: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    // Fetch projects with budget info
    const projects = await prisma.project.findMany({
      where: projectId && projectId !== "all" ? { id: projectId } : {},
      select: {
        id: true,
        name: true,
        budget: true,
        budgetUsed: true,
        status: true,
        _count: {
          select: {
            expenses: true,
          },
        },
      },
    });

    // Calculate statistics
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const billableExpenses = expenses
      .filter((e) => e.billable)
      .reduce((sum, exp) => sum + exp.amount, 0);
    const reimbursedExpenses = expenses
      .filter((e) => e.reimbursed)
      .reduce((sum, exp) => sum + exp.amount, 0);

    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach((exp) => {
      const cat = exp.category;
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + exp.amount;
    });

    // Calculate total budget across all projects
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalBudgetUsed = projects.reduce((sum, p) => sum + (p.budgetUsed || 0), 0);

    const statistics = {
      total: expenses.length,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      billableExpenses: Math.round(billableExpenses * 100) / 100,
      nonBillableExpenses: Math.round((totalExpenses - billableExpenses) * 100) / 100,
      reimbursedExpenses: Math.round(reimbursedExpenses * 100) / 100,
      pendingReimbursement: Math.round((totalExpenses - reimbursedExpenses) * 100) / 100,
      totalBudget: Math.round(totalBudget * 100) / 100,
      totalBudgetUsed: Math.round(totalBudgetUsed * 100) / 100,
      budgetRemaining: Math.round((totalBudget - totalBudgetUsed) * 100) / 100,
      budgetUtilization: totalBudget > 0 ? Math.round((totalBudgetUsed / totalBudget) * 100) : 0,
      expensesByCategory,
    };

    return NextResponse.json({
      expenses,
      projects,
      statistics,
    });
  } catch (error) {
    console.error("Error fetching budget data:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["PROJECT_MANAGER", "SUPER_ADMIN", "TEAM_MEMBER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      projectId,
      category,
      amount,
      date,
      description,
      billable,
      reimbursed,
      receiptUrl,
    } = body;

    // Validate required fields
    if (!category || !amount || !date || !description) {
      return NextResponse.json(
        { error: "Category, amount, date, and description are required" },
        { status: 400 }
      );
    }

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        userId: session.user.id,
        projectId: projectId || null,
        category,
        amount: parseFloat(amount),
        date: new Date(date),
        description,
        billable: billable !== undefined ? billable : false,
        reimbursed: reimbursed !== undefined ? reimbursed : false,
        receiptUrl: receiptUrl || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            budget: true,
            budgetUsed: true,
          },
        },
      },
    });

    // Update project budget if projectId provided
    if (projectId) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          budgetUsed: {
            increment: parseFloat(amount),
          },
        },
      });
    }

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["PROJECT_MANAGER", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get("id");

    if (!expenseId) {
      return NextResponse.json(
        { error: "Expense ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Get the old expense to adjust project budget if amount changes
    const oldExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
      select: { amount: true, projectId: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    // Only update provided fields
    if (body.category !== undefined) updateData.category = body.category;
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.description !== undefined) updateData.description = body.description;
    if (body.billable !== undefined) updateData.billable = body.billable;
    if (body.reimbursed !== undefined) updateData.reimbursed = body.reimbursed;
    if (body.receiptUrl !== undefined) updateData.receiptUrl = body.receiptUrl;
    if (body.projectId !== undefined) updateData.projectId = body.projectId;

    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            budget: true,
            budgetUsed: true,
          },
        },
      },
    });

    // Update project budget if amount changed
    if (oldExpense && body.amount !== undefined && oldExpense.projectId) {
      const amountDiff = parseFloat(body.amount) - oldExpense.amount;
      await prisma.project.update({
        where: { id: oldExpense.projectId },
        data: {
          budgetUsed: {
            increment: amountDiff,
          },
        },
      });
    }

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["PROJECT_MANAGER", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get("id");

    if (!expenseId) {
      return NextResponse.json(
        { error: "Expense ID is required" },
        { status: 400 }
      );
    }

    // Get expense to adjust project budget
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      select: { amount: true, projectId: true },
    });

    // Delete the expense
    await prisma.expense.delete({
      where: { id: expenseId },
    });

    // Update project budget
    if (expense && expense.projectId) {
      await prisma.project.update({
        where: { id: expense.projectId },
        data: {
          budgetUsed: {
            decrement: expense.amount,
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
