'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useTodoStore } from '@/stores/todo-store';
import { Todo, TodoStatus, Priority } from '@prisma/client';
import { toast } from 'sonner';

export function useTodos() {
  const {
    todos,
    isLoading,
    error,
    filter,
    searchQuery,
    focusedTodoId,
    setTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    setFilter,
    setSearchQuery,
    setFocusedTodoId,
    setLoading,
    setError,
  } = useTodoStore();

  // Filter todos client-side based on search query
  const filteredTodos = useMemo(() => {
    if (!searchQuery.trim()) return todos;

    const query = searchQuery.toLowerCase();
    return todos.filter(
      todo =>
        todo.title.toLowerCase().includes(query) ||
        (todo.description && todo.description.toLowerCase().includes(query))
    );
  }, [todos, searchQuery]);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filter.status !== 'ALL') params.set('status', filter.status);
      if (filter.priority !== 'ALL') params.set('priority', filter.priority);

      const response = await fetch(`/api/todos?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch todos');
      }

      const data = await response.json();
      setTodos(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch todos';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filter.status, filter.priority, setTodos, setLoading, setError]);

  const createTodo = useCallback(
    async (data: {
      title: string;
      description?: string;
      status?: TodoStatus;
      priority?: Priority;
      dueDate?: string;
    }) => {
      try {
        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create todo');
        }

        const todo = await response.json();
        addTodo(todo);
        toast.success('Todo created successfully');
        return todo;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create todo';
        toast.error(message);
        throw err;
      }
    },
    [addTodo]
  );

  const editTodo = useCallback(
    async (id: string, data: Partial<Todo>) => {
      try {
        const response = await fetch(`/api/todos/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update todo');
        }

        const todo = await response.json();
        updateTodo(id, todo);
        toast.success('Todo updated successfully');
        return todo;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update todo';
        toast.error(message);
        throw err;
      }
    },
    [updateTodo]
  );

  const removeTodo = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/todos/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete todo');
        }

        deleteTodo(id);
        toast.success('Todo deleted successfully');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete todo';
        toast.error(message);
        throw err;
      }
    },
    [deleteTodo]
  );

  const toggleStatus = useCallback(
    async (id: string, currentStatus: TodoStatus) => {
      const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      return editTodo(id, { status: newStatus });
    },
    [editTodo]
  );

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  return {
    todos: filteredTodos,
    allTodos: todos,
    isLoading,
    error,
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
    refetch: fetchTodos,
  };
}
