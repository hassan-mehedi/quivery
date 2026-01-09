'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, X, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { NoteCard } from './note-card';
import { NoteEditor } from './note-editor';
import { TagSelector } from './tag-selector';
import { ViewModeToggle } from './view-mode-toggle';
import { NotesFilterBar } from './notes-filter-bar';
import { NotesGrid } from './notes-grid';
import { useNotes } from '@/hooks/use-notes';
import { useNoteStore } from '@/stores/note-store';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

export function NotesView() {
  const { isMobile } = useUIStore();
  const {
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
    debouncedSave,
    removeNote,
    createTag,
    updateNotesOrder,
    selectNote,
  } = useNotes();

  const { viewMode, setViewMode, setSearchQuery, setSelectedTagIds } = useNoteStore();
  const [showEditor, setShowEditor] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localTagIds, setLocalTagIds] = useState<string[]>(selectedTagIds);

  useEffect(() => {
    fetchNotes();
    fetchTags();
  }, []);

  useEffect(() => {
    fetchNotes(localSearch, localTagIds.length > 0 ? localTagIds : undefined);
  }, [localSearch, localTagIds]);

  const handleCreateNote = async () => {
    const newNote = await createNote('Untitled Note', '');
    if (isMobile) {
      setShowEditor(true);
    }
  };

  const handleSelectNote = (note: typeof notes[0]) => {
    selectNote(note);
    if (isMobile) {
      setShowEditor(true);
    }
  };

  const handleBack = () => {
    setShowEditor(false);
  };

  const handleDeleteNote = async (id: string) => {
    await removeNote(id);
    selectNote(null);
    if (isMobile) {
      setShowEditor(false);
    }
  };

  const handleToggleTag = (tagId: string) => {
    const newTagIds = localTagIds.includes(tagId)
      ? localTagIds.filter(id => id !== tagId)
      : [...localTagIds, tagId];
    setLocalTagIds(newTagIds);
    setSelectedTagIds(newTagIds);
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    setLocalTagIds([]);
    setSearchQuery('');
    setSelectedTagIds([]);
  };

  const handleReorder = async (reorderedNotes: typeof notes) => {
    const updates = reorderedNotes.map((note, index) => ({
      id: note.id,
      order: index,
    }));
    await updateNotesOrder(updates);
  };

  const hasFilters = localSearch || localTagIds.length > 0;
  const showEmptyState = !isLoading && notes.length === 0;

  // Mobile view: show either list or editor
  if (isMobile) {
    if (showEditor && selectedNote) {
      return (
        <div className="h-full flex flex-col">
          {/* Top Bar */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                placeholder="Search notes..."
                className="pl-9 pr-24 text-foreground"
              />
              <Button
                onClick={handleCreateNote}
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 neon-glow-purple"
              >
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <NoteEditor
              note={selectedNote}
              tags={tags}
              saveStatus={saveStatus}
              onSave={debouncedSave}
              onDelete={handleDeleteNote}
              onCreateTag={createTag}
              onBack={handleBack}
              isMobile
            />
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        {/* Top Bar */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search notes..."
              className="pl-9 pr-24 text-foreground"
            />
            <Button
              onClick={handleCreateNote}
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 neon-glow-purple"
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <TagSelector
              tags={tags}
              selectedTagIds={localTagIds}
              onToggleTag={handleToggleTag}
              onCreateTag={createTag}
            />
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-foreground">
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : showEmptyState ? (
            <EmptyState
              icon={Plus}
              title={hasFilters ? 'No notes found' : 'No notes yet'}
              description={
                hasFilters
                  ? 'Try adjusting your search or filters'
                  : 'Create your first note to get started'
              }
              action={
                !hasFilters && (
                  <Button onClick={handleCreateNote} className="neon-glow-purple">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Note
                  </Button>
                )
              }
            />
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  selected={selectedNote?.id === note.id}
                  onClick={() => handleSelectNote(note)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop view: grid-based layout with top bar
  return (
    <div className="h-full flex flex-col">
      {/* Top Bar */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-2xl flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search notes..."
              className="pl-9 pr-32 text-foreground"
            />
            <Button
              onClick={handleCreateNote}
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 neon-glow-purple"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>

          {/* View Mode Toggle */}
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 border-b border-border">
        <NotesFilterBar
          selectedTagIds={localTagIds}
          allTags={tags}
          onToggleTag={handleToggleTag}
          onClearAll={handleClearFilters}
          onCreateTag={createTag}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          {isLoading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'flex flex-col gap-3 max-w-2xl mx-auto'}>
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className={viewMode === 'grid' ? 'h-[200px]' : 'h-24'} />
              ))}
            </div>
          ) : showEmptyState ? (
            <EmptyState
              icon={hasFilters ? Search : StickyNote}
              title={hasFilters ? 'No notes found' : 'No notes yet'}
              description={
                hasFilters
                  ? 'Try adjusting your search or filters'
                  : 'Create your first note to get started'
              }
              action={
                !hasFilters && (
                  <Button onClick={handleCreateNote} className="neon-glow-purple">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Note
                  </Button>
                )
              }
            />
          ) : (
            <NotesGrid
              notes={notes}
              selectedNote={selectedNote}
              viewMode={viewMode}
              onSelectNote={handleSelectNote}
              onReorder={handleReorder}
              isDraggingEnabled={!isMobile && !hasFilters}
            />
          )}
        </div>
      </div>

      {/* Editor Modal/Overlay (when note is selected on desktop) */}
      {selectedNote && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-4xl h-full max-h-[90vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            <NoteEditor
              note={selectedNote}
              tags={tags}
              saveStatus={saveStatus}
              onSave={debouncedSave}
              onDelete={handleDeleteNote}
              onCreateTag={createTag}
              onBack={() => selectNote(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
