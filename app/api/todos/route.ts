import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TodoStatus, Priority } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const priorityParam = searchParams.get('priority');
    const projectIdParam = searchParams.get('projectId');
    const tagIdParam = searchParams.get('tagId');
    const includeParam = searchParams.get('include'); // e.g., "project,tags,subtasks"
    const parentIdParam = searchParams.get('parentId'); // null to get only top-level todos

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

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

    const todos = await prisma.todo.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      include: Object.keys(include).length > 0 ? include : undefined,
    });

    return NextResponse.json(todos);
  } catch (error) {
    console.error('GET todos error:', error);
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, projectId, tagIds, parentId } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create the todo
    const todo = await prisma.todo.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId || null,
        parentId: parentId || null,
        userId: session.user.id,
      },
      include: {
        project: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Add tags if provided
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      await prisma.todoTag.createMany({
        data: tagIds.map((tagId: string) => ({
          todoId: todo.id,
          tagId,
        })),
        skipDuplicates: true,
      });

      // Fetch the updated todo with tags
      const updatedTodo = await prisma.todo.findUnique({
        where: { id: todo.id },
        include: {
          project: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      return NextResponse.json(updatedTodo, { status: 201 });
    }

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('POST todo error:', error);
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}
