'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Note, Tag } from '@prisma/client';
import { ArrowLeft, Trash2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { TagSelector } from './tag-selector';
import { TagBadge } from './tag-badge';
import { cn } from '@/lib/utils';

// Lazy load the heavy TipTap editor
const RichTextEditor = dynamic(() => import('./rich-text-editor').then((mod) => ({ default: mod.RichTextEditor })), {
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>,
  ssr: false, // Disable SSR for TipTap editor
});

type NoteWithTags = Note & {
  tags: { tag: Tag }[];
};

interface NoteEditorProps {
  note: NoteWithTags;
  tags: Tag[];
  saveStatus: 'idle' | 'saving' | 'saved';
  onSave: (id: string, updates: { title?: string; content?: string; tagIds?: string[] }) => void;
  onDelete: (id: string) => Promise<void>;
  onCreateTag: (name: string, color: string) => Promise<Tag>;
  onBack?: () => void;
  isMobile?: boolean;
}

export function NoteEditor({
  note,
  tags,
  saveStatus,
  onSave,
  onDelete,
  onCreateTag,
  onBack,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    note.tags.map(({ tag }) => tag.id)
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Update local state when note changes
  if (title !== note.title) setTitle(note.title);
  if (content !== note.content) setContent(note.content);
  const noteTagIds = note.tags.map(({ tag }) => tag.id);
  if (JSON.stringify(selectedTagIds) !== JSON.stringify(noteTagIds)) {
    setSelectedTagIds(noteTagIds);
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onSave(note.id, { title: newTitle });
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onSave(note.id, { content: newContent });
  };

  const handleToggleTag = (tagId: string) => {
    const newTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];

    setSelectedTagIds(newTagIds);
    onSave(note.id, { tagIds: newTagIds });
  };

  const handleRemoveTag = (tagId: string) => {
    const newTagIds = selectedTagIds.filter(id => id !== tagId);
    setSelectedTagIds(newTagIds);
    onSave(note.id, { tagIds: newTagIds });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(note.id);
    } catch {
      setIsDeleting(false);
    }
  };

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-4 space-y-4">
        <div className="flex items-center justify-between">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}

          <div className={cn('flex items-center gap-2', onBack && 'ml-auto')}>
            {/* Save Status */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="h-3 w-3 text-green-500" />
                  Saved
                </>
              )}
            </div>

            {/* Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isDeleting} className="text-foreground">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Note</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this note? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Title Input */}
        <Input
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          placeholder="Note title"
          className="text-2xl font-bold border-0 px-0 focus-visible:ring-0 text-foreground"
        />

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedTags.map(tag => (
            <TagBadge key={tag.id} tag={tag} onRemove={() => handleRemoveTag(tag.id)} />
          ))}
          <TagSelector
            tags={tags}
            selectedTagIds={selectedTagIds}
            onToggleTag={handleToggleTag}
            onCreateTag={onCreateTag}
          />
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto bg-background">
        <RichTextEditor
          content={content}
          onChange={handleContentChange}
          placeholder="Start writing your note..."
          className="h-full"
        />
      </div>
    </div>
  );
}
