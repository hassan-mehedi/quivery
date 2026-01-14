import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note, Tag } from '@prisma/client';

type NoteWithTags = Note & {
  tags: { tag: Tag }[];
};

type ViewMode = 'grid' | 'list' | 'compact';

interface NoteState {
  notes: NoteWithTags[];
  tags: Tag[];
  selectedNote: NoteWithTags | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedTagIds: string[];
  viewMode: ViewMode;
  setNotes: (notes: NoteWithTags[]) => void;
  setTags: (tags: Tag[]) => void;
  addNote: (note: NoteWithTags) => void;
  updateNote: (id: string, updates: Partial<NoteWithTags>) => void;
  deleteNote: (id: string) => void;
  selectNote: (note: NoteWithTags | null) => void;
  addTag: (tag: Tag) => void;
  deleteTag: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTagIds: (tagIds: string[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNoteStore = create<NoteState>()(
  persist(
    set => ({
      notes: [],
      tags: [],
      selectedNote: null,
      isLoading: false,
      error: null,
      searchQuery: '',
      selectedTagIds: [],
      viewMode: 'grid',
      setNotes: notes => set({ notes }),
      setTags: tags => set({ tags }),
      addNote: note => set(state => ({ notes: [note, ...state.notes] })),
      updateNote: (id, updates) =>
        set(state => ({
          notes: state.notes.map(n => (n.id === id ? { ...n, ...updates } : n)),
          selectedNote:
            state.selectedNote?.id === id
              ? { ...state.selectedNote, ...updates }
              : state.selectedNote,
        })),
      deleteNote: id =>
        set(state => ({
          notes: state.notes.filter(n => n.id !== id),
          selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
        })),
      selectNote: note => set({ selectedNote: note }),
      addTag: tag => set(state => ({ tags: [...state.tags, tag] })),
      deleteTag: id =>
        set(state => ({
          tags: state.tags.filter(t => t.id !== id),
        })),
      setSearchQuery: searchQuery => set({ searchQuery }),
      setSelectedTagIds: selectedTagIds => set({ selectedTagIds }),
      setViewMode: viewMode => set({ viewMode }),
      setLoading: isLoading => set({ isLoading }),
      setError: error => set({ error }),
    }),
    {
      name: 'note-storage',
      partialize: state => ({ viewMode: state.viewMode }),
    }
  )
);
