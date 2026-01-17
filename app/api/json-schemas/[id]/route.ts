import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (request: NextRequest, userId: string, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const schema = await prisma.jsonSchema.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    if (!schema) {
      return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
    }

    return NextResponse.json(schema);
  } catch (error) {
    console.error('GET json-schema error:', error);
    return NextResponse.json({ error: 'Failed to fetch schema' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (request: NextRequest, userId: string, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const { name, schema, description, version } = await request.json();

    // Verify ownership
    const existing = await prisma.jsonSchema.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
    }

    // Validate JSON if schema is being updated
    if (schema !== undefined) {
      try {
        JSON.parse(schema);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON Schema format' }, { status: 400 });
      }
    }

    // Check for duplicate name if name is being changed
    if (name !== undefined && name !== existing.name) {
      const duplicate = await prisma.jsonSchema.findFirst({
        where: { name: name.trim(), userId, id: { not: id } },
      });

      if (duplicate) {
        return NextResponse.json({ error: 'Schema with this name already exists' }, { status: 400 });
      }
    }

    const updatedSchema = await prisma.jsonSchema.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(schema !== undefined && { schema }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(version !== undefined && { version }),
      },
    });

    return NextResponse.json(updatedSchema);
  } catch (error) {
    console.error('PATCH json-schema error:', error);
    return NextResponse.json({ error: 'Failed to update schema' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: NextRequest, userId: string, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const existing = await prisma.jsonSchema.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
    }

    // Delete schema (documents will have their schemaId set to null due to SetNull cascade)
    await prisma.jsonSchema.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE json-schema error:', error);
    return NextResponse.json({ error: 'Failed to delete schema' }, { status: 500 });
  }
});
