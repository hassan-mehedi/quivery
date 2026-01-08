# Phase 4: Notes Feature Implementation

## Objective

Implement complete Notes functionality including API routes, rich text editor with TipTap, notes list with search, tag management, and responsive note detail view.

## Prerequisites

- Phases 1-3 completed
- TipTap dependencies installed (from Phase 1)

---

## Task 4.1: Create Notes API Routes

Create `app/api/notes/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const tagIds = searchParams.get('tags')?.split(',').filter(Boolean);

    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(tagIds?.length && {
          tags: { some: { tagId: { in: tagIds } } },
        }),
      },
      include: { tags: { include: { tag: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('GET notes error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, tagIds } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        content: content || '',
        userId: session.user.id,
        ...(tagIds?.length && {
          tags: { create: tagIds.map((tagId: string) => ({ tagId })) },
        }),
      },
      include: { tags: { include: { tag: true } } },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('POST note error:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
```

Create `app/api/notes/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const note = await prisma.note.findFirst({
      where: { id, userId: session.user.id },
      include: { tags: { include: { tag: true } } },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('GET note error:', error);
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.note.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const { title, content, tagIds } = await request.json();

    const note = await prisma.$transaction(async tx => {
      await tx.note.update({
        where: { id },
        data: {
          ...(title !== undefined && { title: title.trim() }),
          ...(content !== undefined && { content }),
        },
      });

      if (tagIds !== undefined) {
        await tx.noteTag.deleteMany({ where: { noteId: id } });
        if (tagIds.length > 0) {
          await tx.noteTag.createMany({
            data: tagIds.map((tagId: string) => ({ noteId: id, tagId })),
          });
        }
      }

      return tx.note.findUnique({
        where: { id },
        include: { tags: { include: { tag: true } } },
      });
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('PATCH note error:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.note.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    await prisma.note.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE note error:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
```

---

## Task 4.2: Create Tags API Routes

Create `app/api/tags/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tags = await prisma.tag.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('GET tags error:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, color } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const existing = await prisma.tag.findFirst({
      where: { name: name.trim(), userId: session.user.id },
    });

    if (existing) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 400 });
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
        color: color || '#8B5CF6',
        userId: session.user.id,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('POST tag error:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
```

Create `app/api/tags/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.tag.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    await prisma.tag.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE tag error:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
```

---

## Task 4.3: Create Notes Hook

Create `hooks/use-notes.ts` - This hook manages all note and tag operations with auto-save functionality. Include methods for: fetchNotes, fetchTags, createNote, editNote, debouncedSave (for auto-save), removeNote, createTag, removeTag.

Key implementation details:

- Use debounce from utils for auto-save (1000ms delay)
- Fetch notes with search query and tag filter params
- Toast notifications for success/error
- Update Zustand store on each operation

---

## Task 4.4: Create Rich Text Editor Component

Create `components/notes/rich-text-editor.tsx` using TipTap with:

- StarterKit for basic formatting
- Placeholder extension
- Highlight extension
- TaskList and TaskItem extensions
- Menu bar with formatting buttons
- Prose styling with neon accents

---

## Task 4.5: Create Tag Components

Create `components/notes/tag-badge.tsx`:

- Display tag with custom color
- Optional remove button
- Selected state with ring indicator

Create `components/notes/tag-selector.tsx`:

- Popover with tag list
- Create new tag form with color picker
- 8 preset colors for selection

---

## Task 4.6: Create Note Card Component

Create `components/notes/note-card.tsx`:

- Show title and content preview (stripped HTML)
- Display up to 3 tags with "+N" overflow
- Show relative date
- Selected state with neon glow

---

## Task 4.7: Create Note Editor Component

Create `components/notes/note-editor.tsx`:

- Editable title input
- Rich text editor
- Tag selector and display
- Auto-save indicator (Saving.../Saved)
- Delete confirmation dialog
- Mobile back button

---

## Task 4.8: Update Notes View Component

Replace `components/notes/notes-view.tsx`:

- Mobile: Toggle between list and editor views
- Desktop: Side-by-side layout (320px list + flexible editor)
- Search input with icon
- Tag filter using TagSelector
- Clear filters button
- Empty states for no notes / no results
- Loading skeletons

---

## Task 4.9: Install Additional Components

```bash
npx shadcn@latest add popover scroll-area alert-dialog
npm install -D @tailwindcss/typography
```

---

## Verification Checklist

- [ ] Notes CRUD API works correctly
- [ ] Tags CRUD API works correctly
- [ ] Notes list displays with search and filter
- [ ] Rich text editor formatting works
- [ ] Auto-save shows status indicator
- [ ] Tags can be created and assigned
- [ ] Mobile responsive (list/editor toggle)
- [ ] Desktop side-by-side layout works
- [ ] Delete confirmation works
- [ ] Empty states appear correctly

---

## Next Phase Preview

Phase 5: PWA & Docker Deployment
