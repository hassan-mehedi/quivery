'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Note, Tag } from '@prisma/client';
import { GripVertical } from 'lucide-react';
import { NoteGridCard } from './note-grid-card';
import { NoteListCard } from './note-list-card';
import { NoteCompactCard } from './note-compact-card';

type NoteWithTags = Note & {
  tags: { tag: Tag }[];
};

interface DraggableNoteCardProps {
  note: NoteWithTags;
  selected: boolean;
  focused?: boolean;
  viewMode: 'grid' | 'list' | 'compact';
  onClick: () => void;
  isDraggingEnabled: boolean;
}

export function DraggableNoteCard({
  note,
  selected,
  focused = false,
  viewMode,
  onClick,
  isDraggingEnabled,
}: DraggableNoteCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
    disabled: !isDraggingEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cardContent = (() => {
    switch (viewMode) {
      case 'grid':
        return <NoteGridCard note={note} selected={selected} focused={focused} onClick={onClick} />;
      case 'list':
        return <NoteListCard note={note} selected={selected} focused={focused} onClick={onClick} />;
      case 'compact':
        return (
          <NoteCompactCard note={note} selected={selected} focused={focused} onClick={onClick} />
        );
    }
  })();

  if (!isDraggingEnabled) {
    return cardContent;
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <div className="bg-primary/20 hover:bg-primary/30 rounded p-1 border border-primary/50">
          <GripVertical className="h-4 w-4 text-primary" />
        </div>
      </div>

      {cardContent}
    </div>
  );
}
