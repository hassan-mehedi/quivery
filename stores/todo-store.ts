import { create } from 'zustand'
import { Todo, TodoStatus, Priority } from '@prisma/client'

interface TodoState {
  todos: Todo[]
  isLoading: boolean
  error: string | null
  filter: {
    status: TodoStatus | 'ALL'
    priority: Priority | 'ALL'
  }
  setTodos: (todos: Todo[]) => void
  addTodo: (todo: Todo) => void
  updateTodo: (id: string, updates: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  setFilter: (filter: Partial<TodoState['filter']>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  isLoading: false,
  error: null,
  filter: {
    status: 'ALL',
    priority: 'ALL'
  },
  setTodos: (todos) => set({ todos }),
  addTodo: (todo) => set((state) => ({ todos: [todo, ...state.todos] })),
  updateTodo: (id, updates) => set((state) => ({
    todos: state.todos.map((t) => t.id === id ? { ...t, ...updates } : t)
  })),
  deleteTodo: (id) => set((state) => ({
    todos: state.todos.filter((t) => t.id !== id)
  })),
  setFilter: (filter) => set((state) => ({
    filter: { ...state.filter, ...filter }
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}))
