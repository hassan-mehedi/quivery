import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

// Higher rate limit for read operations (300 requests/minute)
export const GET = withAuth(
  async (request: NextRequest, userId: string, _context: { params: Promise<Record<string, never>> }) => {
    try {
      const schemas = await prisma.jsonSchema.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      });

      return NextResponse.json(schemas, {
        headers: {
          // Cache for 5 minutes (schemas rarely change)
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        },
      });
    } catch (error) {
      console.error('GET json-schemas error:', error);
      return NextResponse.json({ error: 'Failed to fetch schemas' }, { status: 500 });
    }
  },
  { rateLimit: 300 }
);

export const POST = withAuth(async (request: NextRequest, userId: string, _context: { params: Promise<Record<string, never>> }) => {
  try {
    const { name, schema, description, version } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!schema) {
      return NextResponse.json({ error: 'Schema is required' }, { status: 400 });
    }

    // Validate that schema is valid JSON
    try {
      JSON.parse(schema);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON Schema format' }, { status: 400 });
    }

    // Check if schema name already exists for this user
    const existing = await prisma.jsonSchema.findFirst({
      where: { name: name.trim(), userId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Schema with this name already exists' }, { status: 400 });
    }

    const newSchema = await prisma.jsonSchema.create({
      data: {
        name: name.trim(),
        schema,
        description: description?.trim() || null,
        version: version || 'draft-07',
        userId,
      },
    });

    return NextResponse.json(newSchema, { status: 201 });
  } catch (error) {
    console.error('POST json-schema error:', error);
    return NextResponse.json({ error: 'Failed to create schema' }, { status: 500 });
  }
});
