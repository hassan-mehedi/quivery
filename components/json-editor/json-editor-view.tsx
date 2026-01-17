'use client';

import { useEffect, lazy, Suspense } from 'react';
import { useJsonEditor } from '@/hooks/use-json-editor';
import { useJsonEditorStore } from '@/stores/json-editor-store';
import { JsonDocumentCard } from './json-document-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the editor
const JsonDocumentEditor = lazy(() =>
  import('./json-document-editor').then(mod => ({ default: mod.JsonDocumentEditor }))
);

export function JsonEditorView() {
  const {
    documents,
    isLoading,
    searchQuery,
    fetchDocuments,
    fetchSchemas,
    createDocument,
    selectDocument,
  } = useJsonEditor();

  const { selectedDocument, setSearchQuery } = useJsonEditorStore();

  useEffect(() => {
    fetchDocuments();
    fetchSchemas();
  }, [fetchDocuments, fetchSchemas]);

  const handleCreateDocument = async () => {
    try {
      await createDocument('New JSON Document', '{}');
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    fetchDocuments(value);
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">JSON Editor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, edit, and validate JSON documents
          </p>
        </div>

        <Button onClick={handleCreateDocument} className="neon-glow-purple">
          <Plus className="h-4 w-4 mr-2" />
          New Document
        </Button>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b border-border">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <EmptyState
            icon={Search}
            title={searchQuery ? 'No documents found' : 'No JSON documents yet'}
            description={
              searchQuery
                ? 'Try adjusting your search query'
                : 'Create your first JSON document to get started'
            }
            action={
              !searchQuery ? (
                <Button onClick={handleCreateDocument} className="neon-glow-purple">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Document
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDocuments.map(document => (
              <JsonDocumentCard
                key={document.id}
                document={document}
                selected={selectedDocument?.id === document.id}
                onClick={() => selectDocument(document)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Document Editor Modal */}
      {selectedDocument && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <JsonDocumentEditor
            document={selectedDocument}
            onClose={() => selectDocument(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
