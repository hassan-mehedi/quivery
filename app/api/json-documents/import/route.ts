import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export const POST = withAuth(async (request: NextRequest, userId: string, _context: { params: Promise<Record<string, never>> }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size: 10MB' }, { status: 400 });
    }

    // Check file type
    if (!file.name.endsWith('.json')) {
      return NextResponse.json({ error: 'Invalid file type. Only .json files are allowed' }, { status: 400 });
    }

    // Read file content
    const content = await file.text();

    // Validate JSON syntax
    try {
      JSON.parse(content);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 });
    }

    // Extract filename without extension
    const title = file.name.replace(/\.json$/, '');

    // Create document
    const document = await prisma.jsonDocument.create({
      data: {
        title,
        content,
        userId,
      },
      include: { schema: true },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('POST json-documents/import error:', error);
    return NextResponse.json({ error: 'Failed to import document' }, { status: 500 });
  }
});
