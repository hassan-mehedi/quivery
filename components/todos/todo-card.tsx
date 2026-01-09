'use client';

import { Todo } from '@prisma/client';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from './status-badge';
import { PriorityBadge } from './priority-badge';
import { cn, formatRelativeDate } from '@/lib/utils';
import { MoreVertical, Pencil, Trash2, Calendar } from 'lucide-react';

interface TodoCardProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

export function TodoCard({ todo, onToggle, onEdit, onDelete }: TodoCardProps) {
  const isCompleted = todo.status === 'COMPLETED';
  const isCancelled = todo.status === 'CANCELLED';
  const isDimmed = isCompleted || isCancelled;

  return (
    <Card
      className={cn(
        'group transition-all duration-200 border-border/50 hover:border-border',
        'bg-card/50 backdrop-blur-sm hover:bg-card/80',
        isDimmed && 'opacity-60'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => onToggle(todo.id)}
            className={cn(
              'mt-1 transition-all',
              isCompleted &&
                'data-[state=checked]:bg-neon-green data-[state=checked]:border-neon-green'
            )}
          />

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  'font-medium text-foreground line-clamp-2',
                  isCompleted && 'line-through text-muted-foreground'
                )}
              >
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
              <p
                className={cn(
                  'text-sm text-muted-foreground line-clamp-2',
                  isCompleted && 'line-through'
                )}
              >
                {todo.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={todo.status} />
              <PriorityBadge priority={todo.priority} />

              {todo.dueDate && (
                <span
                  className={cn(
                    'inline-flex items-center text-xs text-muted-foreground',
                    new Date(todo.dueDate) < new Date() && !isCompleted && 'text-red-400'
                  )}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatRelativeDate(todo.dueDate)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
