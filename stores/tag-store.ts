import { create } from 'zustand';
import { Tag } from '@prisma/client';

interface TagState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  setTags: (tags: Tag[]) => void;
  addTag: (tag: Tag) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTagStore = create<TagState>(set => ({
  tags: [],
  isLoading: false,
  error: null,
  setTags: tags => set({ tags }),
  addTag: tag => set(state => ({ tags: [...state.tags, tag] })),
  updateTag: (id, updates) =>
    set(state => ({
      tags: state.tags.map(t => (t.id === id ? { ...t, ...updates } : t)),
    })),
  deleteTag: id =>
    set(state => ({
      tags: state.tags.filter(t => t.id !== id),
    })),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),
}));
