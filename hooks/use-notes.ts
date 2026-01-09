import { useState, useCallback, useRef } from 'react';
import { useNoteStore } from '@/stores/note-store';
import { toast } from 'sonner';
import { debounce } from '@/lib/utils';
import { Note, Tag } from '@prisma/client';

type NoteWithTags = Note & {
  tags: { tag: Tag }[];
};

export function useNotes() {
  const {
    notes,
    tags,
    selectedNote,
    isLoading,
    setNotes,
    setTags,
    addNote,
    updateNote,
    deleteNote,
    selectNote,
    addTag,
    deleteTag,
    setLoading,
    searchQuery,
    selectedTagIds,
  } = useNoteStore();

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const fetchNotes = useCallback(
    async (search?: string, tagIds?: string[]) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (tagIds?.length) params.set('tags', tagIds.join(','));

        const response = await fetch(`/api/notes?${params}`);
        if (!response.ok) throw new Error('Failed to fetch notes');

        const data = await response.json();
        setNotes(data);
      } catch (error) {
        console.error('Error fetching notes:', error);
        toast.error('Failed to fetch notes');
      } finally {
        setLoading(false);
      }
    },
    [setNotes, setLoading]
  );

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');

      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast.error('Failed to fetch tags');
    }
  }, [setTags]);

  const createNote = useCallback(
    async (title: string, content?: string, tagIds?: string[]) => {
      try {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content: content || '', tagIds }),
        });

        if (!response.ok) throw new Error('Failed to create note');

        const newNote = await response.json();
        addNote(newNote);
        selectNote(newNote);
        toast.success('Note created successfully');
        return newNote;
      } catch (error) {
        console.error('Error creating note:', error);
        toast.error('Failed to create note');
        throw error;
      }
    },
    [addNote, selectNote]
  );

  const editNote = useCallback(
    async (id: string, updates: { title?: string; content?: string; tagIds?: string[] }) => {
      try {
        const response = await fetch(`/api/notes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) throw new Error('Failed to update note');

        const updatedNote = await response.json();
        updateNote(id, updatedNote);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Error updating note:', error);
        toast.error('Failed to update note');
        setSaveStatus('idle');
        throw error;
      }
    },
    [updateNote]
  );

  // Debounced save function for auto-save (saves 3.5 seconds after user stops typing)
  const debouncedSaveRef = useRef(
    debounce(async (id: string, updates: { title?: string; content?: string; tagIds?: string[] }) => {
      try {
        const response = await fetch(`/api/notes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) throw new Error('Failed to auto-save note');

        const updatedNote = await response.json();
        updateNote(id, updatedNote);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Error auto-saving note:', error);
        setSaveStatus('idle');
      }
    }, 3500)
  );

  const debouncedSave = useCallback(
    (id: string, updates: { title?: string; content?: string; tagIds?: string[] }) => {
      setSaveStatus('saving');
      debouncedSaveRef.current(id, updates);
    },
    []
  );

  const removeNote = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/notes/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete note');

        deleteNote(id);
        toast.success('Note deleted successfully');
      } catch (error) {
        console.error('Error deleting note:', error);
        toast.error('Failed to delete note');
        throw error;
      }
    },
    [deleteNote]
  );

  const createTag = useCallback(
    async (name: string, color: string) => {
      try {
        const response = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, color }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create tag');
        }

        const newTag = await response.json();
        addTag(newTag);
        toast.success('Tag created successfully');
        return newTag;
      } catch (error) {
        console.error('Error creating tag:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to create tag');
        throw error;
      }
    },
    [addTag]
  );

  const removeTag = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/tags/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete tag');

        deleteTag(id);
        toast.success('Tag deleted successfully');
      } catch (error) {
        console.error('Error deleting tag:', error);
        toast.error('Failed to delete tag');
        throw error;
      }
    },
    [deleteTag]
  );

  const updateNotesOrder = useCallback(
    async (updates: { id: string; order: number }[]) => {
      try {
        const response = await fetch('/api/notes/order', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates }),
        });

        if (!response.ok) throw new Error('Failed to update note order');

        return await response.json();
      } catch (error) {
        console.error('Error updating note order:', error);
        toast.error('Failed to reorder notes');
        throw error;
      }
    },
    []
  );

  return {
    notes,
    tags,
    selectedNote,
    isLoading,
    saveStatus,
    searchQuery,
    selectedTagIds,
    fetchNotes,
    fetchTags,
    createNote,
    editNote,
    debouncedSave,
    removeNote,
    createTag,
    removeTag,
    updateNotesOrder,
    selectNote,
  };
}
