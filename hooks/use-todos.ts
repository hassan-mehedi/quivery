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

  const fetchTodos = useCallback(async (includeRelations = true) => {
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

      // Include relations by default
      if (includeRelations) {
        params.set('include', 'project,tags,subtasks');
      }

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
  }, [filter.status, filter.priority, filter.projectId, filter.tagIds, setTodos, setLoading, setError]);

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

  const bulkComplete = useCallback(
    async (ids: string[]) => {
      try {
        const response = await fetch('/api/todos/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, action: 'complete' }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Bulk operation failed');
        }

        await fetchTodos();
        toast.success(`Completed ${ids.length} todo(s)`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Bulk operation failed';
        toast.error(message);
        throw err;
      }
    },
    [fetchTodos]
  );

  const bulkDelete = useCallback(
    async (ids: string[]) => {
      try {
        const response = await fetch('/api/todos/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, action: 'delete' }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Bulk operation failed');
        }

        ids.forEach(id => deleteTodo(id));
        toast.success(`Deleted ${ids.length} todo(s)`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Bulk operation failed';
        toast.error(message);
        throw err;
      }
    },
    [deleteTodo]
  );

  const bulkUpdate = useCallback(
    async (ids: string[], updates: { status?: TodoStatus; priority?: Priority; projectId?: string }) => {
      try {
        const response = await fetch('/api/todos/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, action: 'update', updates }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Bulk operation failed');
        }

        await fetchTodos();
        toast.success(`Updated ${ids.length} todo(s)`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Bulk operation failed';
        toast.error(message);
        throw err;
      }
    },
    [fetchTodos]
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
