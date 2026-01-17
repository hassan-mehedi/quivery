'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { JsonDocumentWithSchema } from '@/stores/json-editor-store';
import { useJsonEditor } from '@/hooks/use-json-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { X, Trash2, Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Lazy load the Monaco editor
const JsonCodeEditor = lazy(() =>
  import('./json-code-editor').then(mod => ({ default: mod.JsonCodeEditor }))
);

interface JsonDocumentEditorProps {
  document: JsonDocumentWithSchema;
  onClose: () => void;
}

export function JsonDocumentEditor({ document, onClose }: JsonDocumentEditorProps) {
  const { debouncedSave, removeDocument, saveStatus } = useJsonEditor();

  const [title, setTitle] = useState(document.title);
  const [description, setDescription] = useState(document.description || '');
  const [content, setContent] = useState(document.content);
  const [currentViewMode, setCurrentViewMode] = useState<'code' | 'tree' | 'visual'>(
    (document.lastViewMode as 'code' | 'tree' | 'visual') || 'code'
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasJsonError, setHasJsonError] = useState(false);

  // Validate JSON on content change
  useEffect(() => {
    try {
      JSON.parse(content);
      setHasJsonError(false);
    } catch (e) {
      setHasJsonError(true);
    }
  }, [content]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    debouncedSave(document.id, { title: newTitle });
  };

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription);
    debouncedSave(document.id, { description: newDescription });
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    debouncedSave(document.id, { content: newContent });
  };

  const handleViewModeChange = (mode: string) => {
    const viewMode = mode as 'code' | 'tree' | 'visual';
    setCurrentViewMode(viewMode);
    debouncedSave(document.id, { lastViewMode: viewMode });
  };

  const handleDelete = async () => {
    try {
      await removeDocument(document.id);
      onClose();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      setContent(formatted);
      debouncedSave(document.id, { content: formatted });
    } catch (error) {
      // JSON is invalid, don't format
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl h-[90vh] bg-card border border-border rounded-lg shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 p-4 border-b border-border">
            <div className="flex-1 space-y-2">
              <Input
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                className="text-lg font-semibold text-foreground bg-transparent border-none focus-visible:ring-0 px-0"
                placeholder="Document title"
              />
              <Textarea
                value={description}
                onChange={e => handleDescriptionChange(e.target.value)}
                className="text-sm text-foreground bg-transparent border-none focus-visible:ring-0 px-0 resize-none"
                placeholder="Add a description (optional)"
                rows={1}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Save status */}
              <div className="flex items-center gap-2 text-sm">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">Saved</span>
                  </>
                )}
                {hasJsonError && (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-500">Invalid JSON</span>
                  </>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={formatJson} disabled={hasJsonError}>
                Format
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Editor Tabs */}
          <Tabs value={currentViewMode} onValueChange={handleViewModeChange} className="flex-1 flex flex-col">
            <div className="border-b border-border px-4">
              <TabsList className="bg-transparent">
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="tree" disabled>
                  Tree
                </TabsTrigger>
                <TabsTrigger value="visual" disabled={!document.schemaId}>
                  Visual
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="code" className="flex-1 m-0 p-0">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                }
              >
                <JsonCodeEditor value={content} onChange={handleContentChange} />
              </Suspense>
            </TabsContent>

            <TabsContent value="tree" className="flex-1 m-0 p-4">
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Tree view coming soon...
              </div>
            </TabsContent>

            <TabsContent value="visual" className="flex-1 m-0 p-4">
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Visual editor coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete JSON Document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{document.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
