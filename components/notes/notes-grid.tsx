'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { Note, Tag } from '@prisma/client';
import { DraggableNoteCard } from './draggable-note-card';
import { NoteGridCard } from './note-grid-card';

type NoteWithTags = Note & {
  tags: { tag: Tag }[];
};

interface NotesGridProps {
  notes: NoteWithTags[];
  selectedNote: NoteWithTags | null;
  focusedNoteId?: string | null;
  viewMode: 'grid' | 'list' | 'compact';
  onSelectNote: (note: NoteWithTags) => void;
  onReorder?: (notes: NoteWithTags[]) => Promise<void>;
  isDraggingEnabled?: boolean;
}

export function NotesGrid({
  notes,
  selectedNote,
  focusedNoteId,
  viewMode,
  onSelectNote,
  onReorder,
  isDraggingEnabled = true,
}: NotesGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localNotes, setLocalNotes] = useState<NoteWithTags[]>(notes);

  // Update local notes when props change (but not during drag)
  useEffect(() => {
    if (!activeId) {
      setLocalNotes(notes);
    }
  }, [notes, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localNotes.findIndex(note => note.id === active.id);
      const newIndex = localNotes.findIndex(note => note.id === over.id);

      const reordered = arrayMove(localNotes, oldIndex, newIndex);
      setLocalNotes(reordered);

      // Persist to backend
      if (onReorder) {
        try {
          await onReorder(reordered);
        } catch (error) {
          // Rollback on error
          setLocalNotes(notes);
        }
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const containerClasses = {
    grid: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
    list: 'flex flex-col gap-3',
    compact: 'flex flex-col gap-2',
  };

  const activeNote = activeId ? localNotes.find(note => note.id === activeId) : null;

  if (!isDraggingEnabled) {
    return (
      <div className={`${containerClasses[viewMode]} transition-all duration-300`}>
        {localNotes.map(note => (
          <DraggableNoteCard
            key={note.id}
            note={note}
            selected={selectedNote?.id === note.id}
            focused={focusedNoteId === note.id}
            viewMode={viewMode}
            onClick={() => onSelectNote(note)}
            isDraggingEnabled={false}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={localNotes.map(note => note.id)} strategy={rectSortingStrategy}>
        <div className={`${containerClasses[viewMode]} transition-all duration-300`}>
          {localNotes.map(note => (
            <DraggableNoteCard
              key={note.id}
              note={note}
              selected={selectedNote?.id === note.id}
              focused={focusedNoteId === note.id}
              viewMode={viewMode}
              onClick={() => onSelectNote(note)}
              isDraggingEnabled={isDraggingEnabled}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeNote ? (
          <div className="cursor-grabbing rotate-2 scale-105">
            <NoteGridCard
              note={activeNote}
              selected={selectedNote?.id === activeNote.id}
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
