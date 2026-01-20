import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { JsonDocument } from '@prisma/client';

export type JsonDocumentSimplified = JsonDocument;

interface JsonEditorState {
  // Data
  documents: JsonDocumentSimplified[];
  selectedDocument: JsonDocumentSimplified | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  isFullscreen: boolean;

  // Comparison mode
  isComparisonMode: boolean;
  comparisonLeftId: string | null;
  comparisonRightId: string | null;

  // Actions
  setDocuments: (documents: JsonDocumentSimplified[]) => void;
  addDocument: (document: JsonDocumentSimplified) => void;
  updateDocument: (id: string, updates: Partial<JsonDocumentSimplified>) => void;
  deleteDocument: (id: string) => void;
  selectDocument: (document: JsonDocumentSimplified | null) => void;

  setSearchQuery: (query: string) => void;
  setFullscreen: (fullscreen: boolean) => void;

  setComparisonMode: (enabled: boolean) => void;
  setComparisonLeft: (id: string | null) => void;
  setComparisonRight: (id: string | null) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useJsonEditorStore = create<JsonEditorState>()(
  persist(
    set => ({
      // Initial state
      documents: [],
      selectedDocument: null,
      isLoading: false,
      error: null,
      searchQuery: '',
      isFullscreen: false,
      isComparisonMode: false,
      comparisonLeftId: null,
      comparisonRightId: null,

      // Document actions
      setDocuments: documents => set({ documents }),
      addDocument: document => set(state => ({ documents: [document, ...state.documents] })),
      updateDocument: (id, updates) =>
        set(state => ({
          documents: state.documents.map(d => (d.id === id ? { ...d, ...updates } : d)),
          selectedDocument:
            state.selectedDocument?.id === id
              ? { ...state.selectedDocument, ...updates }
              : state.selectedDocument,
        })),
      deleteDocument: id =>
        set(state => ({
          documents: state.documents.filter(d => d.id !== id),
          selectedDocument: state.selectedDocument?.id === id ? null : state.selectedDocument,
        })),
      selectDocument: document => set({ selectedDocument: document }),

      // UI actions
      setSearchQuery: searchQuery => set({ searchQuery }),
      setFullscreen: isFullscreen => set({ isFullscreen }),

      // Comparison actions
      setComparisonMode: isComparisonMode =>
        set({
          isComparisonMode,
          // Clear comparison selections when exiting comparison mode
          ...(isComparisonMode
            ? {}
            : { comparisonLeftId: null, comparisonRightId: null }),
        }),
      setComparisonLeft: comparisonLeftId => set({ comparisonLeftId }),
      setComparisonRight: comparisonRightId => set({ comparisonRightId }),

      // General actions
      setLoading: isLoading => set({ isLoading }),
      setError: error => set({ error }),
    }),
    {
      name: 'json-editor-storage',
      partialize: state => ({ isFullscreen: state.isFullscreen }),
    }
  )
);
