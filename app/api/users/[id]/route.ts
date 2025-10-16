import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { createResponseFormatter } from '@/lib/api/response-formatter';

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const formatter = createResponseFormatter(request);
  
  try {
    const { id } = params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return formatter.validationError([
        {
          field: 'id',
          message: 'Invalid user ID format',
          code: 'VAL_012'
        }
      ]);
    }
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        projects: true,
        teams: true,
      },
    });
    
    if (!user) {
      return formatter.notFound('User', id);
    }
    
    return formatter.success(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return formatter.internalError(error as Error);
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const formatter = createResponseFormatter(request);
  
  try {
    const { id } = params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return formatter.validationError([
        {
          field: 'id',
          message: 'Invalid user ID format',
          code: 'VAL_012'
        }
      ]);
    }
    
    const body = await request.json();
    const { email, name, password, role } = body;
    
    // Validate input
    const validationErrors = [];
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.push({
        field: 'email',
        message: 'Invalid email format',
        code: 'VAL_007'
      });
    }
    if (name !== undefined && name.length < 2) {
      validationErrors.push({
        field: 'name',
        message: 'Name must be at least 2 characters',
        code: 'VAL_004'
      });
    }
    if (password && password.length < 8) {
      validationErrors.push({
        field: 'password',
        message: 'Password must be at least 8 characters',
        code: 'VAL_004'
      });
    }
    
    if (validationErrors.length > 0) {
      return formatter.validationError(validationErrors);
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });
    
    if (!existingUser) {
      return formatter.notFound('User', id);
    }
    
    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (password) updateData.password = await hash(password, 10);
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return formatter.success(updatedUser);
  } catch (_error) {
    const error = _error as Error;
    console.error('Error updating user:', error);
    
    // Handle Prisma errors
    if (error.message.includes('Unique constraint')) {
      return formatter.conflict('User', 'Email already exists');
    }
    
    return formatter.internalError(error);
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const formatter = createResponseFormatter(request);
  
  try {
    const { id } = params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return formatter.validationError([
        {
          field: 'id',
          message: 'Invalid user ID format',
          code: 'VAL_012'
        }
      ]);
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });
    
    if (!existingUser) {
      return formatter.notFound('User', id);
    }
    
    // Delete user
    await prisma.user.delete({
      where: { id },
    });
    
    return formatter.success(
      { message: 'User deleted successfully', id },
      204
    );
  } catch (_error) {
    const error = _error as Error;
    console.error('Error deleting user:', error);
    
    // Handle Prisma errors for related records
    if (error.message.includes('Foreign key constraint')) {
      return formatter.conflict('User', 'Cannot delete user with existing related records');
    }
    
    return formatter.internalError(error);
  }
}