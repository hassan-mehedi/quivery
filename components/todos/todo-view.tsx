'use client';

import { useState } from 'react';
import { Todo } from '@prisma/client';
import { useTodos } from '@/hooks/use-todos';
import { TodoCard } from './todo-card';
import { TodoDialog } from './todo-dialog';
import { TodoFilters } from './todo-filters';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, CheckSquare, Loader2 } from 'lucide-react';
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
  const { todos, isLoading, filter, setFilter, createTodo, editTodo, removeTodo, toggleStatus } =
    useTodos();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const completedCount = todos.filter(t => t.status === 'COMPLETED').length;
  const totalCount = todos.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-neon-cyan" />
            TODOs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {completedCount} of {totalCount} tasks completed
          </p>
        </div>

        <Button onClick={handleCreate} className="neon-glow-cyan">
          <Plus className="w-4 h-4 mr-2" />
          Add Todo
        </Button>
      </div>

      {/* Filters */}
      <TodoFilters
        status={filter.status}
        priority={filter.priority}
        onStatusChange={status => setFilter({ status })}
        onPriorityChange={priority => setFilter({ priority })}
        onClear={() => setFilter({ status: 'ALL', priority: 'ALL' })}
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
      ) : (
        <div className="space-y-3">
          {todos.map(todo => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={setDeleteId}
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
