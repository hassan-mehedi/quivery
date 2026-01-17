import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { JsonDocument, JsonSchema } from '@prisma/client';

export type JsonDocumentWithSchema = JsonDocument & {
  schema: JsonSchema | null;
};

export type ViewMode = 'code' | 'tree' | 'visual';

interface JsonEditorState {
  // Data
  documents: JsonDocumentWithSchema[];
  schemas: JsonSchema[];
  selectedDocument: JsonDocumentWithSchema | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  defaultViewMode: ViewMode;

  // Comparison mode
  isComparisonMode: boolean;
  comparisonLeftId: string | null;
  comparisonRightId: string | null;

  // Actions
  setDocuments: (documents: JsonDocumentWithSchema[]) => void;
  setSchemas: (schemas: JsonSchema[]) => void;
  addDocument: (document: JsonDocumentWithSchema) => void;
  updateDocument: (id: string, updates: Partial<JsonDocumentWithSchema>) => void;
  deleteDocument: (id: string) => void;
  selectDocument: (document: JsonDocumentWithSchema | null) => void;

  addSchema: (schema: JsonSchema) => void;
  updateSchema: (id: string, updates: Partial<JsonSchema>) => void;
  deleteSchema: (id: string) => void;

  setSearchQuery: (query: string) => void;
  setDefaultViewMode: (mode: ViewMode) => void;

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
      schemas: [],
      selectedDocument: null,
      isLoading: false,
      error: null,
      searchQuery: '',
      defaultViewMode: 'code',
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

      // Schema actions
      setSchemas: schemas => set({ schemas }),
      addSchema: schema => set(state => ({ schemas: [...state.schemas, schema] })),
      updateSchema: (id, updates) =>
        set(state => ({
          schemas: state.schemas.map(s => (s.id === id ? { ...s, ...updates } : s)),
        })),
      deleteSchema: id =>
        set(state => ({
          schemas: state.schemas.filter(s => s.id !== id),
        })),

      // UI actions
      setSearchQuery: searchQuery => set({ searchQuery }),
      setDefaultViewMode: defaultViewMode => set({ defaultViewMode }),

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
      partialize: state => ({ defaultViewMode: state.defaultViewMode }),
    }
  )
);
