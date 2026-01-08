# Phase 3: TODO Feature Implementation

## Objective

Implement complete TODO functionality including API routes, list view with filtering, card component with status/priority indicators, and add/edit dialogs.

## Prerequisites

- Phase 1 and 2 completed
- Authentication working
- Main layout and sidebar functional

---

## Task 3.1: Create TODO API Routes

Create `app/api/todos/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TodoStatus, Priority } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as TodoStatus | null;
    const priority = searchParams.get('priority') as Priority | null;

    const where: { userId: string; status?: TodoStatus; priority?: Priority } = {
      userId: session.user.id,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    const todos = await prisma.todo.findMany({
      where,
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(todos);
  } catch (error) {
    console.error('GET todos error:', error);
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const todo = await prisma.todo.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('POST todo error:', error);
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}
```

Create `app/api/todos/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const todo = await prisma.todo.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json(todo);
  } catch (error) {
    console.error('GET todo error:', error);
    return NextResponse.json({ error: 'Failed to fetch todo' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.todo.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const { title, description, status, priority, dueDate } = body;

    const todo = await prisma.todo.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    });

    return NextResponse.json(todo);
  } catch (error) {
    console.error('PATCH todo error:', error);
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.todo.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    await prisma.todo.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE todo error:', error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}
```

---

## Task 3.2: Create TODO Hooks

Create `hooks/use-todos.ts`:

```typescript
'use client';

import { useEffect, useCallback } from 'react';
import { useTodoStore } from '@/stores/todo-store';
import { Todo, TodoStatus, Priority } from '@prisma/client';
import { toast } from 'sonner';

export function useTodos() {
  const {
    todos,
    isLoading,
    error,
    filter,
    setTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    setFilter,
    setLoading,
    setError,
  } = useTodoStore();

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
    todos,
    isLoading,
    error,
    filter,
    setFilter,
    createTodo,
    editTodo,
    removeTodo,
    toggleStatus,
    refetch: fetchTodos,
  };
}
```

---

## Task 3.3: Create Status and Priority Badge Components

Create `components/todos/status-badge.tsx`:

```typescript
import { TodoStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Clock, PlayCircle, CheckCircle2, XCircle } from "lucide-react"

const statusConfig: Record<TodoStatus, {
  label: string
  icon: typeof Clock
  className: string
}> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: PlayCircle,
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30"
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-green-500/20 text-green-400 border-green-500/30"
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }
}

interface StatusBadgeProps {
  status: TodoStatus
  showIcon?: boolean
  className?: string
}

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  )
}
```

Create `components/todos/priority-badge.tsx`:

```typescript
import { Priority } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AlertTriangle, ArrowUp, ArrowRight, ArrowDown } from "lucide-react"

const priorityConfig: Record<Priority, {
  label: string
  icon: typeof AlertTriangle
  className: string
}> = {
  URGENT: {
    label: "Urgent",
    icon: AlertTriangle,
    className: "bg-red-500/20 text-red-400 border-red-500/30"
  },
  HIGH: {
    label: "High",
    icon: ArrowUp,
    className: "bg-orange-500/20 text-orange-400 border-orange-500/30"
  },
  MEDIUM: {
    label: "Medium",
    icon: ArrowRight,
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
  },
  LOW: {
    label: "Low",
    icon: ArrowDown,
    className: "bg-slate-500/20 text-slate-400 border-slate-500/30"
  }
}

interface PriorityBadgeProps {
  priority: Priority
  showIcon?: boolean
  className?: string
}

export function PriorityBadge({ priority, showIcon = true, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  )
}
```

---

## Task 3.4: Create TODO Card Component

Create `components/todos/todo-card.tsx`:

```typescript
"use client"

import { Todo } from "@prisma/client"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "./status-badge"
import { PriorityBadge } from "./priority-badge"
import { cn, formatRelativeDate } from "@/lib/utils"
import { MoreVertical, Pencil, Trash2, Calendar } from "lucide-react"

interface TodoCardProps {
  todo: Todo
  onToggle: (id: string) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
}

export function TodoCard({ todo, onToggle, onEdit, onDelete }: TodoCardProps) {
  const isCompleted = todo.status === "COMPLETED"
  const isCancelled = todo.status === "CANCELLED"
  const isDimmed = isCompleted || isCancelled

  return (
    <Card className={cn(
      "group transition-all duration-200 border-border/50 hover:border-border",
      "bg-card/50 backdrop-blur-sm hover:bg-card/80",
      isDimmed && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => onToggle(todo.id)}
            className={cn(
              "mt-1 transition-all",
              isCompleted && "data-[state=checked]:bg-neon-green data-[state=checked]:border-neon-green"
            )}
          />

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className={cn(
                "font-medium text-foreground line-clamp-2",
                isCompleted && "line-through text-muted-foreground"
              )}>
                {todo.title}
              </h3>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(todo)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(todo.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {todo.description && (
              <p className={cn(
                "text-sm text-muted-foreground line-clamp-2",
                isCompleted && "line-through"
              )}>
                {todo.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={todo.status} />
              <PriorityBadge priority={todo.priority} />

              {todo.dueDate && (
                <span className={cn(
                  "inline-flex items-center text-xs text-muted-foreground",
                  new Date(todo.dueDate) < new Date() && !isCompleted && "text-red-400"
                )}>
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatRelativeDate(todo.dueDate)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## Task 3.5: Create TODO Dialog Component

Create `components/todos/todo-dialog.tsx`:

```typescript
"use client"

import { useState, useEffect } from "react"
import { Todo, TodoStatus, Priority } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface TodoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  todo?: Todo | null
  onSubmit: (data: {
    title: string
    description?: string
    status: TodoStatus
    priority: Priority
    dueDate?: string
  }) => Promise<void>
}

const statusOptions: { value: TodoStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" }
]

const priorityOptions: { value: Priority; label: string }[] = [
  { value: "URGENT", label: "Urgent" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" }
]

export function TodoDialog({ open, onOpenChange, todo, onSubmit }: TodoDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<TodoStatus>("PENDING")
  const [priority, setPriority] = useState<Priority>("MEDIUM")
  const [dueDate, setDueDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const isEditing = !!todo

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDescription(todo.description || "")
      setStatus(todo.status)
      setPriority(todo.priority)
      setDueDate(todo.dueDate ? new Date(todo.dueDate).toISOString().split("T")[0] : "")
    } else {
      setTitle("")
      setDescription("")
      setStatus("PENDING")
      setPriority("MEDIUM")
      setDueDate("")
    }
  }, [todo, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    setIsLoading(true)
    try {
      await onSubmit({
        title,
        description: description || undefined,
        status,
        priority,
        dueDate: dueDate || undefined
      })
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Todo" : "Create Todo"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              className="focus-neon"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="focus-neon resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TodoStatus)}>
                <SelectTrigger className="focus-neon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="focus-neon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (optional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="focus-neon"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="neon-glow-cyan">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Save Changes" : "Create Todo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Task 3.6: Create TODO Filter Component

Create `components/todos/todo-filters.tsx`:

```typescript
"use client"

import { TodoStatus, Priority } from "@prisma/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface TodoFiltersProps {
  status: TodoStatus | "ALL"
  priority: Priority | "ALL"
  onStatusChange: (status: TodoStatus | "ALL") => void
  onPriorityChange: (priority: Priority | "ALL") => void
  onClear: () => void
}

const statusOptions = [
  { value: "ALL", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" }
]

const priorityOptions = [
  { value: "ALL", label: "All Priority" },
  { value: "URGENT", label: "Urgent" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" }
]

export function TodoFilters({
  status,
  priority,
  onStatusChange,
  onPriorityChange,
  onClear
}: TodoFiltersProps) {
  const hasFilters = status !== "ALL" || priority !== "ALL"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[140px] h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={priority} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[140px] h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {priorityOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-9 px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
}
```

---

## Task 3.7: Create Empty State Component

Create `components/ui/empty-state.tsx`:

```typescript
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-4">{description}</p>
      {action}
    </div>
  )
}
```

---

## Task 3.8: Update TODO View Component

Replace `components/todos/todo-view.tsx`:

```typescript
"use client"

import { useState } from "react"
import { Todo } from "@prisma/client"
import { useTodos } from "@/hooks/use-todos"
import { TodoCard } from "./todo-card"
import { TodoDialog } from "./todo-dialog"
import { TodoFilters } from "./todo-filters"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, CheckSquare, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function TodoView() {
  const {
    todos,
    isLoading,
    filter,
    setFilter,
    createTodo,
    editTodo,
    removeTodo,
    toggleStatus
  } = useTodos()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCreate = () => {
    setEditingTodo(null)
    setDialogOpen(true)
  }

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo)
    setDialogOpen(true)
  }

  const handleSubmit = async (data: Parameters<typeof createTodo>[0]) => {
    if (editingTodo) {
      await editTodo(editingTodo.id, data)
    } else {
      await createTodo(data)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await removeTodo(deleteId)
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleToggle = async (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (todo) {
      await toggleStatus(id, todo.status)
    }
  }

  const completedCount = todos.filter(t => t.status === "COMPLETED").length
  const totalCount = todos.length

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
        onStatusChange={(status) => setFilter({ status })}
        onPriorityChange={(priority) => setFilter({ priority })}
        onClear={() => setFilter({ status: "ALL", priority: "ALL" })}
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
          {todos.map((todo) => (
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
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
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
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

---

## Task 3.9: Add Skeleton Component (if not already added)

Ensure `components/ui/skeleton.tsx` exists. If not, run:

```bash
npx shadcn@latest add skeleton
```

---

## Verification Checklist

After completing this phase, verify:

- [ ] GET /api/todos returns user's todos
- [ ] POST /api/todos creates new todo
- [ ] PATCH /api/todos/[id] updates todo
- [ ] DELETE /api/todos/[id] deletes todo
- [ ] Todo list displays correctly
- [ ] Status badges show correct colors/icons
- [ ] Priority badges show correct colors/icons
- [ ] Clicking checkbox toggles completion
- [ ] Add todo dialog works
- [ ] Edit todo dialog pre-fills data
- [ ] Delete confirmation works
- [ ] Filters work correctly
- [ ] Empty state shows when no todos
- [ ] Toast notifications appear
- [ ] Loading states display properly
- [ ] Responsive on mobile

---

## Next Phase Preview

Phase 4 will cover:

- Notes API routes (CRUD)
- Rich text editor with TipTap
- Notes list with search
- Tag management
- Note detail view
