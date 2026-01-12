import { create } from 'zustand';
import { Todo, TodoStatus, Priority } from '@prisma/client';

interface TodoState {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
  viewMode: 'timeline' | 'list';
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
  toggleTodoSelection: (id: string) => void;
  selectMultipleTodos: (ids: string[]) => void;
  clearSelection: () => void;
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
  clearSelection: () => set({ selectedTodoIds: new Set() }),
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
