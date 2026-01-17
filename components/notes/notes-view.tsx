'use client';

import { useEffect, useState, useCallback } from 'react';
import { Note, Tag } from '@prisma/client';
import { Search, Plus, X, StickyNote, Keyboard } from 'lucide-react';
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

type NoteWithTags = Note & {
  tags: { tag: Tag }[];
};

export function NotesView() {
  const isMobile = useUIStore(state => state.isMobile);
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

  // Use individual selectors to prevent unnecessary re-renders
  const viewMode = useNoteStore(state => state.viewMode);
  const setViewMode = useNoteStore(state => state.setViewMode);
  const setSearchQuery = useNoteStore(state => state.setSearchQuery);
  const setSelectedTagIds = useNoteStore(state => state.setSelectedTagIds);
  const [showEditor, setShowEditor] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localTagIds, setLocalTagIds] = useState<string[]>(selectedTagIds);
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);
  const [showShortcutsHint, setShowShortcutsHint] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('notes-shortcuts-hint-seen');
    }
    return false;
  });

  useEffect(() => {
    fetchNotes();
    fetchTags();
  }, [fetchNotes, fetchTags]);

  useEffect(() => {
    fetchNotes(localSearch, localTagIds.length > 0 ? localTagIds : undefined);
  }, [localSearch, localTagIds, fetchNotes]);

  const handleCreateNote = useCallback(async () => {
    await createNote('Untitled Note', '');
    if (isMobile) {
      setShowEditor(true);
    }
  }, [createNote, isMobile]);

  const handleSelectNote = useCallback(
    (note: (typeof notes)[0]) => {
      selectNote(note);
      if (isMobile) {
        setShowEditor(true);
      }
    },
    [selectNote, isMobile]
  );

  const handleBack = () => {
    setShowEditor(false);
  };

  const handleDeleteNote = useCallback(
    async (id: string) => {
      await removeNote(id);
      selectNote(null);
      if (isMobile) {
        setShowEditor(false);
      }
    },
    [removeNote, selectNote, isMobile]
  );

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

  const handleReorder = async (reorderedNotes: NoteWithTags[]) => {
    const updates = reorderedNotes.map((note, index) => ({
      id: note.id,
      order: index,
    }));
    await updateNotesOrder(updates);
  };

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Don't handle shortcuts if editor is open (on desktop)
      if (!isMobile && selectedNote) {
        return;
      }

      // Create new note - N or C
      if (e.key === 'n' || e.key === 'N' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleCreateNote();
        return;
      }

      // Show keyboard shortcuts hint - Shift+?
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowShortcutsHint(prev => !prev);
        return;
      }

      // Focus search - /
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[placeholder*="Search notes"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Escape to clear focus and selection
      if (e.key === 'Escape') {
        setFocusedNoteId(null);
        setShowShortcutsHint(false);
        selectNote(null);
        return;
      }

      // View mode shortcuts (desktop only)
      if (!isMobile) {
        if (e.key === 'g' || e.key === 'G') {
          e.preventDefault();
          setViewMode('grid');
          return;
        }
        if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          setViewMode('list');
          return;
        }
        if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          setViewMode('compact');
          return;
        }
      }

      // Navigation and actions on focused note
      if (notes.length === 0) return;

      const currentIndex = focusedNoteId ? notes.findIndex((n: NoteWithTags) => n.id === focusedNoteId) : -1;

      // Arrow down - navigate to next note
      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        const nextIndex = currentIndex < notes.length - 1 ? currentIndex + 1 : 0;
        setFocusedNoteId(notes[nextIndex].id);
        return;
      }

      // Arrow up - navigate to previous note
      if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : notes.length - 1;
        setFocusedNoteId(notes[prevIndex].id);
        return;
      }

      // Enter - open focused note
      if (e.key === 'Enter' && focusedNoteId) {
        e.preventDefault();
        const note = notes.find((n: NoteWithTags) => n.id === focusedNoteId);
        if (note) handleSelectNote(note);
        return;
      }

      // Delete/Backspace - delete focused note
      if ((e.key === 'Delete' || e.key === 'Backspace') && focusedNoteId) {
        e.preventDefault();
        handleDeleteNote(focusedNoteId);
        setFocusedNoteId(null);
        return;
      }

      // Duplicate note - Cmd/Ctrl+D
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && focusedNoteId) {
        e.preventDefault();
        const note = notes.find((n: NoteWithTags) => n.id === focusedNoteId);
        if (note) {
          createNote(`${note.title} (copy)`, note.content);
        }
        return;
      }
    },
    [
      notes,
      focusedNoteId,
      isMobile,
      selectedNote,
      handleCreateNote,
      handleSelectNote,
      handleDeleteNote,
      createNote,
      selectNote,
      setViewMode,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Show shortcuts hint on first visit
  useEffect(() => {
    if (showShortcutsHint) {
      const timer = setTimeout(() => {
        setShowShortcutsHint(false);
        localStorage.setItem('notes-shortcuts-hint-seen', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showShortcutsHint]);

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
                className="pl-9 text-foreground"
              />
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
              className="pl-9 text-foreground"
            />
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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-foreground"
              >
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
                  <Button onClick={handleCreateNote} className="neon-glow-pink">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Note
                  </Button>
                )
              }
            />
          ) : (
            <div className="space-y-3">
              {notes.map((note: NoteWithTags) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  selected={selectedNote?.id === note.id}
                  focused={focusedNoteId === note.id}
                  onClick={() => handleSelectNote(note)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Floating Add Button */}
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            onClick={handleCreateNote}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg neon-glow-pink"
            title="Add Note"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>
    );
  }

  // Desktop view: grid-based layout with top bar
  return (
    <div className="space-y-6 px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Notes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />

          <Button
            onClick={() => setShowShortcutsHint(prev => !prev)}
            variant="outline"
            size="icon"
            title="Keyboard shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </Button>
          <Button onClick={handleCreateNote} className="neon-glow-pink">
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      {showShortcutsHint && (
        <div className="bg-neon-pink/10 border border-neon-pink/30 rounded-lg p-4">
          <h3 className="font-semibold text-neon-pink mb-3 flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Keyboard Shortcuts
          </h3>
          <div className="space-y-4">
            {/* Navigation */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Navigation
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    ↑↓
                  </kbd>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    J/K
                  </kbd>
                  <span className="text-muted-foreground">Navigate notes</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    /
                  </kbd>
                  <span className="text-muted-foreground">Focus search</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    Esc
                  </kbd>
                  <span className="text-muted-foreground">Clear selection/close</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Actions
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    N
                  </kbd>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    C
                  </kbd>
                  <span className="text-muted-foreground">Create new note</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    Enter
                  </kbd>
                  <span className="text-muted-foreground">Open note</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    Del
                  </kbd>
                  <span className="text-muted-foreground">Delete note</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    Cmd/Ctrl+D
                  </kbd>
                  <span className="text-muted-foreground">Duplicate note</span>
                </div>
              </div>
            </div>

            {/* View Modes */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                View Modes
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    G
                  </kbd>
                  <span className="text-muted-foreground">Grid view</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    L
                  </kbd>
                  <span className="text-muted-foreground">List view</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    T
                  </kbd>
                  <span className="text-muted-foreground">Compact view</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={localSearch}
          onChange={e => setLocalSearch(e.target.value)}
          placeholder="Search notes..."
          className="pl-9 text-foreground"
        />
      </div>

      {/* Filter Bar */}
      <NotesFilterBar
        selectedTagIds={localTagIds}
        allTags={tags}
        onToggleTag={handleToggleTag}
        onClearAll={handleClearFilters}
        onCreateTag={createTag}
      />

      {/* Content */}
      {isLoading ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'flex flex-col gap-3 max-w-2xl mx-auto'
          }
        >
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
              <Button onClick={handleCreateNote} className="neon-glow-pink">
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
          focusedNoteId={focusedNoteId}
          viewMode={viewMode}
          onSelectNote={handleSelectNote}
          onReorder={handleReorder}
          isDraggingEnabled={!isMobile && !hasFilters}
        />
      )}

      {/* Floating Add Button (Mobile Only) */}
      <div className="fixed bottom-6 right-6 md:hidden z-40">
        <Button
          onClick={handleCreateNote}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg neon-glow-pink"
          title="Add Note"
        >
          <Plus className="w-6 h-6" />
        </Button>
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
