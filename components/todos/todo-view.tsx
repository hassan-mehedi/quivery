'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Todo, Priority } from '@prisma/client';
import { useTodos } from '@/hooks/use-todos';
import { useTodoStore } from '@/stores/todo-store';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TodoCard } from './todo-card';
import { DraggableTodoCard } from './draggable-todo-card';
import { TodoDialog } from './todo-dialog';
import { TodoFilters } from './todo-filters';
import { QuickAddInput } from './quick-add-input';
import { SearchBar } from './search-bar';
import { GroupedTimelineView } from './grouped-timeline-view';
import { BulkActionsBar } from './bulk-actions-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, CheckSquare, Loader2, Keyboard, List, Calendar, CheckCheck } from 'lucide-react';
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

  // Get view mode and multi-select from store
  const viewMode = useTodoStore(state => state.viewMode);
  const setViewMode = useTodoStore(state => state.setViewMode);
  const isMultiSelectMode = useTodoStore(state => state.isMultiSelectMode);
  const toggleMultiSelectMode = useTodoStore(state => state.toggleMultiSelectMode);
  const selectedTodoIds = useTodoStore(state => state.selectedTodoIds);
  const toggleTodoSelection = useTodoStore(state => state.toggleTodoSelection);
  const selectAllVisible = useTodoStore(state => state.selectAllVisible);
  const clearSelection = useTodoStore(state => state.clearSelection);
  const bulkDelete = useTodoStore(state => state.bulkDelete);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showShortcutsHint, setShowShortcutsHint] = useState(false);
  const viewRef = useRef<HTMLDivElement>(null);

  // Drag and drop state
  const [activeTodoId, setActiveTodoId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
  );

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

  const handleToggle = useCallback(
    async (id: string) => {
      const todo = todos.find(t => t.id === id);
      if (todo) {
        await toggleStatus(id, todo.status);
      }
    },
    [todos, toggleStatus]
  );

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

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Todo>) => {
      await editTodo(id, updates);
    },
    [editTodo]
  );

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

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveTodoId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTodoId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = todos.findIndex(t => t.id === active.id);
    const newIndex = todos.findIndex(t => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder todos locally for immediate feedback
    const newTodos = [...todos];
    const [movedTodo] = newTodos.splice(oldIndex, 1);
    newTodos.splice(newIndex, 0, movedTodo);

    // Update local state
    newTodos.forEach((todo, index) => {
      if (todo.sortOrder !== index) {
        editTodo(todo.id, { sortOrder: index });
      }
    });
  };

  const activeTodo = todos.find(t => t.id === activeTodoId);

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

      // Toggle multi-select mode
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMultiSelectMode();
        return;
      }

      // Select all visible todos
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        const visibleTodoIds = todos.map(t => t.id);
        selectAllVisible(visibleTodoIds);
        return;
      }

      // Bulk delete selected todos
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTodoIds.size > 0) {
        e.preventDefault();
        const selectedIds = Array.from(selectedTodoIds);
        bulkDelete(selectedIds).then(() => clearSelection());
        return;
      }

      // Show keyboard shortcuts hint
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowShortcutsHint(prev => !prev);
        return;
      }

      // Escape to clear focus and selection
      if (e.key === 'Escape') {
        setFocusedTodoId(null);
        setShowShortcutsHint(false);
        if (isMultiSelectMode || selectedTodoIds.size > 0) {
          clearSelection();
        }
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

      // Delete/Backspace - delete focused todo (only if no selection)
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        focusedTodoId &&
        selectedTodoIds.size === 0
      ) {
        e.preventDefault();
        setDeleteId(focusedTodoId);
        return;
      }

      // Priority shortcuts - 1 (Urgent), 2 (High), 3 (Medium), 4 (Low)
      if (focusedTodoId && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const priorityMap: Record<string, Priority> = {
          '1': 'URGENT',
          '2': 'HIGH',
          '3': 'MEDIUM',
          '4': 'LOW',
        };
        handleUpdate(focusedTodoId, { priority: priorityMap[e.key] });
        return;
      }

      // Duplicate todo - Cmd/Ctrl+D
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && focusedTodoId) {
        e.preventDefault();
        const todo = todos.find(t => t.id === focusedTodoId);
        if (todo) {
          createTodo({
            title: `${todo.title} (copy)`,
            description: todo.description || undefined,
            status: 'PENDING',
            priority: todo.priority,
            dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString() : undefined,
            projectId: todo.projectId || undefined,
          });
        }
        return;
      }
    },
    [
      todos,
      focusedTodoId,
      setFocusedTodoId,
      isMultiSelectMode,
      selectedTodoIds,
      toggleMultiSelectMode,
      selectAllVisible,
      clearSelection,
      bulkDelete,
      handleUpdate,
      createTodo,
      handleToggle,
    ]
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
            onClick={toggleMultiSelectMode}
            variant={isMultiSelectMode ? 'default' : 'outline'}
            size="icon"
            className={isMultiSelectMode ? 'neon-glow-cyan' : ''}
            title="Multi-select mode (M)"
          >
            <CheckCheck className="w-4 h-4" />
          </Button>

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
          <h3 className="font-semibold text-neon-cyan mb-3 flex items-center gap-2">
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
                  <span className="text-muted-foreground">Navigate todos</span>
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
                  <span className="text-muted-foreground">Clear selection</span>
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
                    Q
                  </kbd>
                  <span className="text-muted-foreground">Quick add todo</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    Space
                  </kbd>
                  <span className="text-muted-foreground">Toggle complete</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    Enter
                  </kbd>
                  <span className="text-muted-foreground">Edit details</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    Del
                  </kbd>
                  <span className="text-muted-foreground">Delete todo(s)</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    Cmd/Ctrl+D
                  </kbd>
                  <span className="text-muted-foreground">Duplicate todo</span>
                </div>
              </div>
            </div>

            {/* Editing */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Editing
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    1
                  </kbd>
                  <span className="text-muted-foreground">Urgent priority</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    2
                  </kbd>
                  <span className="text-muted-foreground">High priority</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    3
                  </kbd>
                  <span className="text-muted-foreground">Medium priority</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    4
                  </kbd>
                  <span className="text-muted-foreground">Low priority</span>
                </div>
              </div>
            </div>

            {/* Bulk Operations */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Bulk Operations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    M
                  </kbd>
                  <span className="text-muted-foreground">Multi-select mode</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs mr-2 text-foreground">
                    Cmd/Ctrl+A
                  </kbd>
                  <span className="text-muted-foreground">Select all</span>
                </div>
              </div>
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {todos.map(todo => (
                <DraggableTodoCard
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
                  isSelected={selectedTodoIds.has(todo.id)}
                  onSelect={toggleTodoSelection}
                  isMultiSelectMode={isMultiSelectMode}
                />
              ))}
            </div>
          </SortableContext>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTodo ? (
              <div className="opacity-90 rotate-2 scale-105">
                <TodoCard
                  todo={activeTodo}
                  onToggle={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onUpdate={async () => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar />

      {/* Floating Add Button (Mobile Only) */}
      <div className="fixed bottom-6 right-6 md:hidden z-40">
        <Button
          onClick={handleCreate}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg neon-glow-cyan"
          title="Add Todo"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

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
