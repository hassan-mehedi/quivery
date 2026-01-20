'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { JsonDocument } from '@prisma/client';
import { useJsonEditor } from '@/hooks/use-json-editor';
import { useJsonEditorStore } from '@/stores/json-editor-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { X, Trash2, Check, Loader2, AlertCircle, Download, MoreVertical, Copy, FileJson, Maximize2, Minimize2, GitCompare } from 'lucide-react';
import { DiffEditor } from '@monaco-editor/react';
import { toast } from 'sonner';

// Lazy load the editor
const JsonCodeEditor = lazy(() =>
  import('./json-code-editor').then(mod => ({ default: mod.JsonCodeEditor }))
);

interface JsonDocumentEditorProps {
  document: JsonDocument;
  onClose: () => void;
}

export function JsonDocumentEditor({ document, onClose }: JsonDocumentEditorProps) {
  const { debouncedSave, removeDocument, saveStatus } = useJsonEditor();
  const { documents, isFullscreen, setFullscreen } = useJsonEditorStore();

  const [title, setTitle] = useState(document.title);
  const [description, setDescription] = useState(document.description || '');
  const [content, setContent] = useState(document.content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasJsonError, setHasJsonError] = useState(false);
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [diffTargetId, setDiffTargetId] = useState<string | null>(null);

  // Validate JSON syntax on content change
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

  const toggleFullscreen = () => {
    setFullscreen(!isFullscreen);
  };

  const toggleDiffMode = () => {
    setIsDiffMode(!isDiffMode);
    if (isDiffMode) {
      setDiffTargetId(null);
    }
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
      toast.success('JSON formatted');
    } catch (error) {
      toast.error('Cannot format invalid JSON');
    }
  };

  const handleExport = async (format: 'pretty' | 'minified') => {
    try {
      const response = await fetch(`/api/json-documents/${document.id}/export?format=${format}`);

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Document exported');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export document');
    }
  };

  const handleCopyJson = async (format: 'pretty' | 'minified') => {
    try {
      const parsed = JSON.parse(content);
      const formatted = format === 'pretty' ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
      await navigator.clipboard.writeText(formatted);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy JSON');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className={`w-full ${isFullscreen ? 'max-w-none h-[calc(100vh-2rem)]' : 'max-w-6xl h-[90vh]'} bg-card border border-border rounded-lg shadow-2xl flex flex-col`}>
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

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Save status */}
              <div className="flex items-center gap-2 text-sm">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground hidden sm:inline">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-500 hidden sm:inline">Saved</span>
                  </>
                )}
                {hasJsonError && (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-500 hidden sm:inline">Invalid JSON</span>
                  </>
                )}
              </div>

              {/* Icon toolbar */}
              <TooltipProvider>
                {/* Format button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={formatJson} disabled={hasJsonError}>
                      <FileJson className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Format JSON</TooltipContent>
                </Tooltip>

                {/* Fullscreen button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</TooltipContent>
                </Tooltip>

                {/* Diff button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleDiffMode}
                      className={isDiffMode ? 'bg-accent' : ''}
                    >
                      <GitCompare className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Compare Documents</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* More menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleCopyJson('pretty')}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy (Pretty)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopyJson('minified')}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy (Minified)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('pretty')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export (Pretty)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('minified')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export (Minified)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {isDiffMode && (
              <div className="px-4 py-2 border-b border-border">
                <Select value={diffTargetId || ''} onValueChange={setDiffTargetId}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Select document to compare..." />
                  </SelectTrigger>
                  <SelectContent>
                    {documents
                      .filter(d => d.id !== document.id)
                      .map(doc => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                }
              >
                {isDiffMode && diffTargetId ? (
                  <DiffEditor
                    original={content}
                    modified={documents.find(d => d.id === diffTargetId)?.content || ''}
                    language="json"
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      renderSideBySide: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                    }}
                  />
                ) : (
                  <JsonCodeEditor value={content} onChange={handleContentChange} />
                )}
              </Suspense>
            </div>
          </div>
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
