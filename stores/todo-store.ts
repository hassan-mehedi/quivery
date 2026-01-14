import { create } from 'zustand';
import { Todo, TodoStatus, Priority } from '@prisma/client';

interface TodoState {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
  viewMode: 'timeline' | 'list';
  isMultiSelectMode: boolean;
  selectedTodoIds: Set<string>;
  expandedSections: Set<string>;
  filter: {
    status: TodoStatus | 'ALL';
    priority: Priority | 'ALL';
    projectId: string | 'ALL';
    tagIds: string[];
  };
  searchQuery: string;
  focusedTodoId: string | null;
  setTodos: (todos: Todo[]) => void;
  addTodo: (todo: Todo) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  setViewMode: (mode: 'timeline' | 'list') => void;
  toggleMultiSelectMode: () => void;
  toggleTodoSelection: (id: string) => void;
  selectMultipleTodos: (ids: string[]) => void;
  selectAllVisible: (todoIds: string[]) => void;
  clearSelection: () => void;
  bulkUpdateStatus: (ids: string[], status: TodoStatus) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkAssignProject: (ids: string[], projectId: string | null) => Promise<void>;
  bulkAddTags: (ids: string[], tagIds: string[]) => Promise<void>;
  bulkSetPriority: (ids: string[], priority: Priority) => Promise<void>;
  toggleSection: (section: string) => void;
  setFilter: (filter: Partial<TodoState['filter']>) => void;
  setSearchQuery: (query: string) => void;
  setFocusedTodoId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTodoStore = create<TodoState>(set => ({
  todos: [],
  isLoading: false,
  error: null,
  viewMode: 'timeline',
  isMultiSelectMode: false,
  selectedTodoIds: new Set(),
  expandedSections: new Set(['overdue', 'today', 'tomorrow', 'thisWeek', 'later', 'noDate']),
  filter: {
    status: 'ALL',
    priority: 'ALL',
    projectId: 'ALL',
    tagIds: [],
  },
  searchQuery: '',
  focusedTodoId: null,
  setTodos: todos => set({ todos }),
  addTodo: todo => set(state => ({ todos: [todo, ...state.todos] })),
  updateTodo: (id, updates) =>
    set(state => ({
      todos: state.todos.map(t => (t.id === id ? { ...t, ...updates } : t)),
    })),
  deleteTodo: id =>
    set(state => ({
      todos: state.todos.filter(t => t.id !== id),
    })),
  setViewMode: viewMode => set({ viewMode }),
  toggleMultiSelectMode: () =>
    set(state => ({
      isMultiSelectMode: !state.isMultiSelectMode,
      selectedTodoIds: new Set(),
    })),
  toggleTodoSelection: id =>
    set(state => {
      const newSelection = new Set(state.selectedTodoIds);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { selectedTodoIds: newSelection };
    }),
  selectMultipleTodos: ids =>
    set(state => ({
      selectedTodoIds: new Set([...state.selectedTodoIds, ...ids]),
    })),
  selectAllVisible: todoIds => set({ selectedTodoIds: new Set(todoIds) }),
  clearSelection: () => set({ selectedTodoIds: new Set(), isMultiSelectMode: false }),
  bulkUpdateStatus: async (ids, status) => {
    try {
      const response = await fetch('/api/todos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'update', updates: { status } }),
      });

      if (!response.ok) throw new Error('Failed to update todos');

      // Optimistic update
      set(state => ({
        todos: state.todos.map(t => (ids.includes(t.id) ? { ...t, status } : t)),
        selectedTodoIds: new Set(),
        isMultiSelectMode: false,
      }));
    } catch (error) {
      console.error('Bulk update failed:', error);
      set({ error: 'Failed to update todos' });
      throw error;
    }
  },
  bulkDelete: async ids => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/todos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'delete' }),
      });

      if (!response.ok) throw new Error('Failed to delete todos');

      set(state => ({
        todos: state.todos.filter(t => !ids.includes(t.id)),
        selectedTodoIds: new Set(),
        isMultiSelectMode: false,
      }));
    } catch (error) {
      console.error('Bulk delete failed:', error);
      throw error;
    }
  },
  bulkAssignProject: async (ids, projectId) => {
    try {
      const response = await fetch('/api/todos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids,
          action: 'update',
          updates: { projectId },
        }),
      });

      if (!response.ok) throw new Error('Failed to assign project');

      // Update local state
      set(state => ({
        todos: state.todos.map(t =>
          ids.includes(t.id) ? { ...t, projectId: projectId || null } : t
        ),
      }));
    } catch (error) {
      console.error('Bulk assign project error:', error);
      throw error;
    }
  },
  bulkAddTags: async (ids, tagIds) => {
    try {
      const response = await fetch('/api/todos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'addTags', updates: { tagIds } }),
      });

      if (!response.ok) {
        throw new Error('Failed to add tags to todos');
      }

      // Note: We don't update local state for tags here since tags require full refetch
      // The useTodos hook will handle the refresh
    } catch (error) {
      console.error('Bulk add tags failed:', error);
      throw error;
    }
  },
  bulkSetPriority: async (ids, priority) => {
    try {
      const response = await fetch('/api/todos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids,
          action: 'update',
          updates: { priority },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update priority');
      }

      // Update local state
      set(state => ({
        todos: state.todos.map(t => (ids.includes(t.id) ? { ...t, priority } : t)),
      }));
    } catch (error) {
      console.error('Bulk priority update error:', error);
      throw error;
    }
  },
  toggleSection: section =>
    set(state => {
      const newSections = new Set(state.expandedSections);
      if (newSections.has(section)) {
        newSections.delete(section);
      } else {
        newSections.add(section);
      }
      return { expandedSections: newSections };
    }),
  setFilter: filter =>
    set(state => ({
      filter: { ...state.filter, ...filter },
    })),
  setSearchQuery: searchQuery => set({ searchQuery }),
  setFocusedTodoId: focusedTodoId => set({ focusedTodoId }),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),
}));
