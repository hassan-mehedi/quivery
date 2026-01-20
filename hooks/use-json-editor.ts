import { useState, useCallback, useRef } from 'react';
import { useJsonEditorStore } from '@/stores/json-editor-store';
import { toast } from 'sonner';
import { debounce } from '@/lib/utils';

export function useJsonEditor() {
  const {
    documents,
    selectedDocument,
    isLoading,
    setDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
    selectDocument,
    setLoading,
    searchQuery,
  } = useJsonEditorStore();

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const fetchDocuments = useCallback(
    async (search?: string) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);

        const response = await fetch(`/api/json-documents?${params}`);

        if (!response.ok) {
          if (response.status === 429) {
            toast.error('Too many requests. Please slow down and try again in a moment.');
            return;
          }
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch documents' }));
          throw new Error(errorData.error || 'Failed to fetch documents');
        }

        const { documents: fetchedDocuments } = await response.json();
        setDocuments(fetchedDocuments);
      } catch (error) {
        console.error('Error fetching documents:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch documents';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [setDocuments, setLoading]
  );

  const createDocument = useCallback(
    async (title: string, content?: string, description?: string) => {
      try {
        // Validate JSON syntax
        if (content) {
          try {
            JSON.parse(content);
          } catch (e) {
            toast.error('Invalid JSON syntax');
            throw new Error('Invalid JSON syntax');
          }
        }

        const response = await fetch('/api/json-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content: content || '{}',
            description,
          }),
        });

        if (!response.ok) throw new Error('Failed to create document');

        const newDocument = await response.json();
        addDocument(newDocument);
        selectDocument(newDocument);
        toast.success('JSON document created successfully');
        return newDocument;
      } catch (error) {
        console.error('Error creating document:', error);
        if (error instanceof Error && error.message !== 'Invalid JSON syntax') {
          toast.error('Failed to create document');
        }
        throw error;
      }
    },
    [addDocument, selectDocument]
  );

  const editDocument = useCallback(
    async (id: string, updates: {
      title?: string;
      content?: string;
      description?: string;
    }) => {
      try {
        // Validate JSON syntax if content is being updated
        if (updates.content !== undefined) {
          try {
            JSON.parse(updates.content);
          } catch (e) {
            toast.error('Invalid JSON syntax');
            throw new Error('Invalid JSON syntax');
          }
        }

        const response = await fetch(`/api/json-documents/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) throw new Error('Failed to update document');

        const updatedDocument = await response.json();
        updateDocument(id, updatedDocument);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Error updating document:', error);
        if (error instanceof Error && error.message !== 'Invalid JSON syntax') {
          toast.error('Failed to update document');
        }
        setSaveStatus('idle');
        throw error;
      }
    },
    [updateDocument]
  );

  // Debounced save function for auto-save (saves 3.5 seconds after user stops typing)
  const debouncedSaveRef = useRef(
    debounce(
      async (id: string, updates: {
        title?: string;
        content?: string;
        description?: string;
      }) => {
        try {
          // Validate JSON syntax if content is being updated
          if (updates.content !== undefined) {
            try {
              JSON.parse(updates.content);
            } catch (e) {
              toast.error('Invalid JSON syntax - cannot save');
              setSaveStatus('idle');
              return;
            }
          }

          const response = await fetch(`/api/json-documents/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });

          if (!response.ok) throw new Error('Failed to auto-save document');

          const updatedDocument = await response.json();
          updateDocument(id, updatedDocument);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
          console.error('Error auto-saving document:', error);
          setSaveStatus('idle');
        }
      },
      3500
    )
  );

  const debouncedSave = useCallback(
    (id: string, updates: {
      title?: string;
      content?: string;
      description?: string;
    }) => {
      setSaveStatus('saving');
      debouncedSaveRef.current(id, updates);
    },
    []
  );

  const removeDocument = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/json-documents/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete document');

        deleteDocument(id);
        toast.success('JSON document deleted successfully');
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document');
        throw error;
      }
    },
    [deleteDocument]
  );

  const importDocument = useCallback(
    async (file: File) => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/json-documents/import', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to import document');
        }

        const newDocument = await response.json();
        addDocument(newDocument);
        selectDocument(newDocument);
        toast.success('Document imported successfully');
        return newDocument;
      } catch (error) {
        console.error('Error importing document:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to import document');
        throw error;
      }
    },
    [addDocument, selectDocument]
  );

  const updateDocumentsOrder = useCallback(async (updates: { id: string; order: number }[]) => {
    try {
      const response = await fetch('/api/json-documents/order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) throw new Error('Failed to update document order');

      return await response.json();
    } catch (error) {
      console.error('Error updating document order:', error);
      toast.error('Failed to reorder documents');
      throw error;
    }
  }, []);

  return {
    documents,
    selectedDocument,
    isLoading,
    saveStatus,
    searchQuery,
    fetchDocuments,
    createDocument,
    editDocument,
    debouncedSave,
    removeDocument,
    importDocument,
    updateDocumentsOrder,
    selectDocument,
  };
}
