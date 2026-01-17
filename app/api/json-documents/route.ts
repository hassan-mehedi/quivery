import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

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
      const search = searchParams.get('search');
      const schemaId = searchParams.get('schemaId');

      const where: Record<string, unknown> = {
        userId,
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(schemaId && { schemaId }),
      };

      // Fetch documents and count in parallel for pagination
      const [documents, total] = await Promise.all([
        prisma.jsonDocument.findMany({
          where,
          include: { schema: true },
          orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
          skip,
          take: limit,
        }),
        prisma.jsonDocument.count({ where }),
      ]);

      return NextResponse.json({
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + documents.length < total,
        },
      });
    } catch (error) {
      console.error('GET json-documents error:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }
  },
  { rateLimit: 300 }
);

export const POST = withAuth(async (request: NextRequest, userId: string, _context: { params: Promise<Record<string, never>> }) => {
  try {
    const { title, content, description, schemaId } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Validate JSON syntax
    let parsedContent = '{}';
    if (content) {
      try {
        JSON.parse(content);
        parsedContent = content;
      } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON syntax' }, { status: 400 });
      }
    }

    // Verify schema exists if provided
    if (schemaId) {
      const schema = await prisma.jsonSchema.findUnique({
        where: { id: schemaId, userId },
      });
      if (!schema) {
        return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
      }
    }

    const document = await prisma.jsonDocument.create({
      data: {
        title: title.trim(),
        content: parsedContent,
        description: description?.trim() || null,
        userId,
        schemaId: schemaId || null,
      },
      include: { schema: true },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('POST json-document error:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
});
