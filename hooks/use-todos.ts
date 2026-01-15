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

  // Note: Search is now handled server-side in fetchTodos
  const filteredTodos = todos;

  const fetchTodos = useCallback(
    async (includeRelations = true) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filter.status !== 'ALL') params.set('status', filter.status);
        if (filter.priority !== 'ALL') params.set('priority', filter.priority);
        if (filter.projectId !== 'ALL') params.set('projectId', filter.projectId);
        if (filter.tagIds && filter.tagIds.length > 0) {
          // For simplicity, filter by first tag (can be enhanced to support multiple)
          params.set('tagId', filter.tagIds[0]);
        }

        // Database-level search
        if (searchQuery.trim()) {
          params.set('search', searchQuery.trim());
        }

        // Include relations by default
        if (includeRelations) {
          params.set('include', 'project,tags,subtasks');
        }

        const response = await fetch(`/api/todos?${params}`);

        if (!response.ok) {
          if (response.status === 429) {
            const message = 'Too many requests. Please slow down and try again in a moment.';
            setError(message);
            toast.error(message);
            return;
          }
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch todos' }));
          throw new Error(errorData.error || 'Failed to fetch todos');
        }

        const { todos: fetchedTodos } = await response.json();
        setTodos(fetchedTodos);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch todos';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [
      filter.status,
      filter.priority,
      filter.projectId,
      filter.tagIds,
      searchQuery,
      setTodos,
      setLoading,
      setError,
    ]
  );

  const createTodo = useCallback(
    async (data: {
      title: string;
      description?: string;
      status?: TodoStatus;
      priority?: Priority;
      dueDate?: string;
      projectId?: string;
      tagIds?: string[];
      parentId?: string;
    }) => {
      try {
        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          if (response.status === 429) {
            toast.error('Too many requests. Please slow down and try again in a moment.');
            throw new Error('Rate limit exceeded');
          }
          const error = await response.json().catch(() => ({ error: 'Failed to create todo' }));
          throw new Error(error.error || 'Failed to create todo');
        }

        const todo = await response.json();
        addTodo(todo);
        toast.success('Todo created successfully');
        return todo;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create todo';
        if (message !== 'Rate limit exceeded') {
          toast.error(message);
        }
        throw err;
      }
    },
    [addTodo]
  );

  const editTodo = useCallback(
    async (id: string, data: Partial<Todo>) => {
      // Optimistic update - update UI immediately
      const previousTodo = todos.find((t: Todo) => t.id === id);
      updateTodo(id, data);

      try {
        const response = await fetch(`/api/todos/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          if (response.status === 429) {
            toast.error('Too many requests. Please slow down and try again in a moment.');
            throw new Error('Rate limit exceeded');
          }
          const error = await response.json().catch(() => ({ error: 'Failed to update todo' }));
          throw new Error(error.error || 'Failed to update todo');
        }

        const todo = await response.json();
        updateTodo(id, todo);
        toast.success('Todo updated successfully');
        return todo;
      } catch (err) {
        // Rollback on error
        if (previousTodo) {
          updateTodo(id, previousTodo);
        }
        const message = err instanceof Error ? err.message : 'Failed to update todo';
        if (message !== 'Rate limit exceeded') {
          toast.error(message);
        }
        throw err;
      }
    },
    [todos, updateTodo]
  );

  const removeTodo = useCallback(
    async (id: string) => {
      // Optimistic delete - remove from UI immediately
      const previousTodo = todos.find((t: Todo) => t.id === id);
      deleteTodo(id);

      try {
        const response = await fetch(`/api/todos/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          if (response.status === 429) {
            toast.error('Too many requests. Please slow down and try again in a moment.');
            throw new Error('Rate limit exceeded');
          }
          const error = await response.json().catch(() => ({ error: 'Failed to delete todo' }));
          throw new Error(error.error || 'Failed to delete todo');
        }

        toast.success('Todo deleted successfully');
      } catch (err) {
        // Rollback on error
        if (previousTodo) {
          addTodo(previousTodo);
        }
        const message = err instanceof Error ? err.message : 'Failed to delete todo';
        if (message !== 'Rate limit exceeded') {
          toast.error(message);
        }
        throw err;
      }
    },
    [todos, deleteTodo, addTodo]
  );

  const toggleStatus = useCallback(
    async (id: string, currentStatus: TodoStatus) => {
      const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      return editTodo(id, { status: newStatus });
    },
    [editTodo]
  );

  const bulkComplete = useCallback(
    async (ids: string[]) => {
      // Optimistic update - mark as completed immediately
      const previousTodos = ids.map(id => todos.find((t: Todo) => t.id === id)).filter(Boolean);
      ids.forEach(id => updateTodo(id, { status: 'COMPLETED' as TodoStatus }));

      try {
        const response = await fetch('/api/todos/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, action: 'complete' }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            toast.error('Too many requests. Please slow down and try again in a moment.');
            throw new Error('Rate limit exceeded');
          }
          const error = await response.json().catch(() => ({ error: 'Bulk operation failed' }));
          throw new Error(error.error || 'Bulk operation failed');
        }

        toast.success(`Completed ${ids.length} todo(s)`);
      } catch (err) {
        // Rollback on error
        previousTodos.forEach(todo => {
          if (todo) updateTodo(todo.id, todo);
        });
        const message = err instanceof Error ? err.message : 'Bulk operation failed';
        if (message !== 'Rate limit exceeded') {
          toast.error(message);
        }
        throw err;
      }
    },
    [todos, updateTodo]
  );

  const bulkDelete = useCallback(
    async (ids: string[]) => {
      // Optimistic delete - remove from UI immediately
      const previousTodos = ids.map(id => todos.find((t: Todo) => t.id === id)).filter(Boolean);
      ids.forEach(id => deleteTodo(id));

      try {
        const response = await fetch('/api/todos/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, action: 'delete' }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            toast.error('Too many requests. Please slow down and try again in a moment.');
            throw new Error('Rate limit exceeded');
          }
          const error = await response.json().catch(() => ({ error: 'Bulk operation failed' }));
          throw new Error(error.error || 'Bulk operation failed');
        }

        toast.success(`Deleted ${ids.length} todo(s)`);
      } catch (err) {
        // Rollback on error
        previousTodos.forEach(todo => {
          if (todo) addTodo(todo);
        });
        const message = err instanceof Error ? err.message : 'Bulk operation failed';
        if (message !== 'Rate limit exceeded') {
          toast.error(message);
        }
        throw err;
      }
    },
    [todos, deleteTodo, addTodo]
  );

  const bulkUpdate = useCallback(
    async (
      ids: string[],
      updates: { status?: TodoStatus; priority?: Priority; projectId?: string }
    ) => {
      // Optimistic update - apply changes immediately
      const previousTodos = ids.map(id => todos.find((t: Todo) => t.id === id)).filter(Boolean);
      ids.forEach(id => updateTodo(id, updates));

      try {
        const response = await fetch('/api/todos/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, action: 'update', updates }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            toast.error('Too many requests. Please slow down and try again in a moment.');
            throw new Error('Rate limit exceeded');
          }
          const error = await response.json().catch(() => ({ error: 'Bulk operation failed' }));
          throw new Error(error.error || 'Bulk operation failed');
        }

        toast.success(`Updated ${ids.length} todo(s)`);
      } catch (err) {
        // Rollback on error
        previousTodos.forEach(todo => {
          if (todo) updateTodo(todo.id, todo);
        });
        const message = err instanceof Error ? err.message : 'Bulk operation failed';
        if (message !== 'Rate limit exceeded') {
          toast.error(message);
        }
        throw err;
      }
    },
    [todos, updateTodo]
  );

  const bulkAddTags = useCallback(
    async (ids: string[], tagIds: string[]) => {
      try {
        const response = await fetch('/api/todos/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, action: 'addTags', updates: { tagIds } }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Bulk operation failed');
        }

        await fetchTodos();
        toast.success(`Added tags to ${ids.length} todo(s)`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Bulk operation failed';
        toast.error(message);
        throw err;
      }
    },
    [fetchTodos]
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
    bulkComplete,
    bulkDelete,
    bulkUpdate,
    bulkAddTags,
    refetch: fetchTodos,
  };
}
