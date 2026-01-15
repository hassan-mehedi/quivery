import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';
import { TodoStatus, Priority } from '@prisma/client';

// Higher rate limit for read operations (300 requests/minute)
export const GET = withAuth(
  async (request: NextRequest, userId: string, _context: { params: Promise<Record<string, never>> }) => {
    try {
      const { searchParams } = new URL(request.url);

    // Pagination params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Filter params
    const statusParam = searchParams.get('status');
    const priorityParam = searchParams.get('priority');
    const projectIdParam = searchParams.get('projectId');
    const tagIdParam = searchParams.get('tagId');
    const includeParam = searchParams.get('include'); // e.g., "project,tags,subtasks"
    const parentIdParam = searchParams.get('parentId'); // null to get only top-level todos
    const searchQuery = searchParams.get('search'); // Database-level search

    const where: Record<string, unknown> = {
      userId,
    };

    // Database-level search
    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    if (statusParam && statusParam !== 'ALL') {
      where.status = statusParam as TodoStatus;
    }
    if (priorityParam && priorityParam !== 'ALL') {
      where.priority = priorityParam as Priority;
    }
    if (projectIdParam && projectIdParam !== 'ALL') {
      where.projectId = projectIdParam;
    }
    if (tagIdParam && tagIdParam !== 'ALL') {
      where.tags = {
        some: {
          tagId: tagIdParam,
        },
      };
    }
    // Filter by parentId (null for top-level, specific ID for subtasks)
    if (parentIdParam !== undefined) {
      where.parentId = parentIdParam === 'null' ? null : parentIdParam;
    } else {
      // Default: only return top-level todos (no parent)
      where.parentId = null;
    }

    // Build include object based on query param
    const include: Record<string, unknown> = {};
    if (includeParam) {
      const includes = includeParam.split(',');
      if (includes.includes('project')) {
        include.project = true;
      }
      if (includes.includes('tags')) {
        include.tags = {
          include: {
            tag: true,
          },
        };
      }
      if (includes.includes('subtasks')) {
        include.subtasks = {
          orderBy: { sortOrder: 'asc' },
        };
      }
    }

    // Fetch todos and count in parallel for pagination
    const [todos, total] = await Promise.all([
      prisma.todo.findMany({
        where,
        orderBy: [
          { sortOrder: 'asc' },
          { status: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        include: Object.keys(include).length > 0 ? include : undefined,
        skip,
        take: limit,
      }),
      prisma.todo.count({ where }),
    ]);

    return NextResponse.json({
      todos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + todos.length < total,
      },
    });
  } catch (error) {
    console.error('GET todos error:', error);
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
},
{ rateLimit: 300 }
);

export const POST = withAuth(async (request: NextRequest, userId: string, _context: { params: Promise<Record<string, never>> }) => {
  try {
    const body = await request.json();
    const { title, description, status, priority, dueDate, projectId, tagIds, parentId } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create the todo with tags in a single transaction
    const todo = await prisma.$transaction(async (tx) => {
      const newTodo = await tx.todo.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          status: status || 'PENDING',
          priority: priority || 'MEDIUM',
          dueDate: dueDate ? new Date(dueDate) : null,
          projectId: projectId || null,
          parentId: parentId || null,
          userId,
        },
      });

      // Add tags if provided
      if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
        await tx.todoTag.createMany({
          data: tagIds.map((tagId: string) => ({
            todoId: newTodo.id,
            tagId,
          })),
          skipDuplicates: true,
        });
      }

      // Fetch with relations
      return tx.todo.findUnique({
        where: { id: newTodo.id },
        include: {
          project: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('POST todo error:', error);
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
});
