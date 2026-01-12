'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Todo, Priority } from '@prisma/client';
import { useTodos } from '@/hooks/use-todos';
import { useTodoStore } from '@/stores/todo-store';
import { TodoCard } from './todo-card';
import { TodoDialog } from './todo-dialog';
import { TodoFilters } from './todo-filters';
import { QuickAddInput } from './quick-add-input';
import { SearchBar } from './search-bar';
import { GroupedTimelineView } from './grouped-timeline-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, CheckSquare, Loader2, Keyboard, List, Calendar } from 'lucide-react';
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

export function TodoView() {
  const {
    todos,
    isLoading,
    filter,
    searchQuery,
    focusedTodoId,
    setFilter,
    setSearchQuery,
    setFocusedTodoId,
    createTodo,
    editTodo,
    removeTodo,
    toggleStatus,
  } = useTodos();

  // Get view mode from store
  const viewMode = useTodoStore(state => state.viewMode);
  const setViewMode = useTodoStore(state => state.setViewMode);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showShortcutsHint, setShowShortcutsHint] = useState(false);
  const viewRef = useRef<HTMLDivElement>(null);

  const handleCreate = () => {
    setEditingTodo(null);
    setDialogOpen(true);
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: Parameters<typeof createTodo>[0]) => {
    if (editingTodo) {
      const updates = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      };
      await editTodo(editingTodo.id, updates);
    } else {
      await createTodo(data);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await removeTodo(deleteId);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleToggle = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      await toggleStatus(id, todo.status);
    }
  };

  const handleQuickAdd = async (data: {
    title: string;
    priority?: Priority;
    dueDate?: string;
    projectId?: string;
    tagIds?: string[];
  }) => {
    await createTodo({
      title: data.title,
      status: 'PENDING',
      priority: data.priority || 'MEDIUM',
      dueDate: data.dueDate,
      projectId: data.projectId,
      tagIds: data.tagIds,
    });
    setShowQuickAdd(false);
  };

  const handleUpdate = async (id: string, updates: Partial<Todo>) => {
    await editTodo(id, updates);
  };

  const handleCreateSubtask = async (parentId: string, title: string) => {
    await createTodo({
      title,
      status: 'PENDING',
      priority: 'MEDIUM',
      parentId,
    });
  };

  const handleUpdateSubtask = async (id: string, title: string) => {
    await editTodo(id, { title });
  };

  const handleDeleteSubtask = async (id: string) => {
    await removeTodo(id);
  };

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Quick add shortcuts
      if (e.key === 'q' || e.key === 'Q' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setShowQuickAdd(true);
        return;
      }

      // Show keyboard shortcuts hint
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowShortcutsHint(prev => !prev);
        return;
      }

      // Escape to clear focus
      if (e.key === 'Escape') {
        setFocusedTodoId(null);
        setShowShortcutsHint(false);
        return;
      }

      // Navigation and actions on focused todo
      if (todos.length === 0) return;

      const currentIndex = focusedTodoId ? todos.findIndex(t => t.id === focusedTodoId) : -1;

      // Arrow down - navigate to next todo
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < todos.length - 1 ? currentIndex + 1 : 0;
        setFocusedTodoId(todos[nextIndex].id);
        return;
      }

      // Arrow up - navigate to previous todo
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : todos.length - 1;
        setFocusedTodoId(todos[prevIndex].id);
        return;
      }

      // Space - toggle completion
      if (e.key === ' ' && focusedTodoId) {
        e.preventDefault();
        handleToggle(focusedTodoId);
        return;
      }

      // Enter - open edit dialog
      if (e.key === 'Enter' && focusedTodoId) {
        e.preventDefault();
        const todo = todos.find(t => t.id === focusedTodoId);
        if (todo) handleEdit(todo);
        return;
      }

      // Delete/Backspace - delete todo
      if ((e.key === 'Delete' || e.key === 'Backspace') && focusedTodoId) {
        e.preventDefault();
        setDeleteId(focusedTodoId);
        return;
      }
    },
    [todos, focusedTodoId, setFocusedTodoId]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Show shortcuts hint on first visit
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('todo-shortcuts-hint-seen');
    if (!hasSeenHint) {
      setShowShortcutsHint(true);
      setTimeout(() => {
        setShowShortcutsHint(false);
        localStorage.setItem('todo-shortcuts-hint-seen', 'true');
      }, 5000);
    }
  }, []);

  // Persist view mode to localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('todo-view-mode');
    if (savedViewMode && (savedViewMode === 'timeline' || savedViewMode === 'list')) {
      setViewMode(savedViewMode);
    }
  }, [setViewMode]);

  useEffect(() => {
    localStorage.setItem('todo-view-mode', viewMode);
  }, [viewMode]);

  const completedCount = todos.filter(t => t.status === 'COMPLETED').length;
  const totalCount = todos.length;

  return (
    <div className="space-y-6" ref={viewRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-neon-cyan" />
            TODOs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {completedCount} of {totalCount} tasks completed
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-lg p-1">
            <Button
              onClick={() => setViewMode('timeline')}
              variant={viewMode === 'timeline' ? 'default' : 'ghost'}
              size="sm"
              className={viewMode === 'timeline' ? 'neon-glow-cyan' : ''}
              title="Timeline view"
            >
              <Calendar className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setViewMode('list')}
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className={viewMode === 'list' ? 'neon-glow-cyan' : ''}
              title="List view"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={() => setShowShortcutsHint(prev => !prev)}
            variant="outline"
            size="icon"
            title="Keyboard shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </Button>
          <Button onClick={handleCreate} className="neon-glow-cyan">
            <Plus className="w-4 h-4 mr-2" />
            Add Todo
          </Button>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      {showShortcutsHint && (
        <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-4">
          <h3 className="font-semibold text-neon-cyan mb-2 flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Keyboard Shortcuts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <kbd className="px-2 py-1 bg-muted rounded text-xs mr-2">Q</kbd>
              <span className="text-muted-foreground">Quick add todo</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-muted rounded text-xs mr-2">/</kbd>
              <span className="text-muted-foreground">Focus search</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-muted rounded text-xs mr-2">↑↓</kbd>
              <span className="text-muted-foreground">Navigate todos</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-muted rounded text-xs mr-2">Space</kbd>
              <span className="text-muted-foreground">Toggle complete</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-muted rounded text-xs mr-2">Enter</kbd>
              <span className="text-muted-foreground">Edit details</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-muted rounded text-xs mr-2">Del</kbd>
              <span className="text-muted-foreground">Delete todo</span>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Quick Add Input */}
      <QuickAddInput
        isVisible={showQuickAdd}
        onSubmit={handleQuickAdd}
        onCancel={() => setShowQuickAdd(false)}
      />

      {/* Filters */}
      <TodoFilters
        status={filter.status}
        priority={filter.priority}
        projectId={filter.projectId}
        tagIds={filter.tagIds}
        onStatusChange={status => setFilter({ status })}
        onPriorityChange={priority => setFilter({ priority })}
        onProjectChange={projectId => setFilter({ projectId })}
        onTagChange={tagIds => setFilter({ tagIds })}
        onClear={() => setFilter({ status: 'ALL', priority: 'ALL', projectId: 'ALL', tagIds: [] })}
      />

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : todos.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No todos yet"
          description="Create your first todo to get started organizing your tasks."
          action={
            <Button onClick={handleCreate} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create Todo
            </Button>
          }
        />
      ) : viewMode === 'timeline' ? (
        <GroupedTimelineView
          todos={todos}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={setDeleteId}
          focusedTodoId={focusedTodoId}
        />
      ) : (
        <div className="space-y-2">
          {todos.map(todo => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={setDeleteId}
              onUpdate={handleUpdate}
              onCreateSubtask={handleCreateSubtask}
              onToggleSubtask={handleToggle}
              onUpdateSubtask={handleUpdateSubtask}
              onDeleteSubtask={handleDeleteSubtask}
              isFocused={focusedTodoId === todo.id}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <TodoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        todo={editingTodo}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Todo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this todo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
