'use client';

import { useState } from 'react';
import { Todo } from '@prisma/client';
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
import { MoreVertical, Pencil, Trash2, Calendar, ChevronDown, ChevronRight } from 'lucide-react';

interface TodoCardCompactProps {
  todo: Todo & {
    project?: { id: string; name: string; color: string } | null;
    tags?: Array<{ tag: { id: string; name: string; color: string } }>;
    subtasks?: Todo[];
  };
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  isFocused?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function TodoCardCompact({
  todo,
  onToggle,
  onEdit,
  onDelete,
  isFocused,
  isSelected,
  onSelect,
}: TodoCardCompactProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isCompleted = todo.status === 'COMPLETED';
  const isCancelled = todo.status === 'CANCELLED';
  const isDimmed = isCompleted || isCancelled;
  const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
  const hasDescription = !!todo.description;

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !isCompleted;

  return (
    <div className="space-y-1">
      {/* Main Card */}
      <div
        className={cn(
          'group flex items-center gap-2 p-2 rounded-lg',
          'transition-all duration-200',
          'bg-card/30 backdrop-blur-sm border border-border/30',
          'hover:bg-card/50 hover:border-border',
          isDimmed && 'opacity-50',
          isFocused && 'ring-2 ring-neon-cyan',
          isSelected && 'ring-2 ring-neon-cyan bg-neon-cyan/5'
        )}
      >
        {/* Checkbox */}
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggle(todo.id)}
          className={cn(
            'shrink-0 transition-all',
            isCompleted &&
              'data-[state=checked]:bg-neon-green data-[state=checked]:border-neon-green'
          )}
        />

        {/* Expand/Collapse (if has description or subtasks) */}
        {(hasDescription || hasSubtasks) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        )}

        {/* Title */}
        <button
          onClick={() => onEdit(todo)}
          className={cn(
            'flex-1 text-left text-sm font-medium truncate',
            isCompleted && 'line-through text-muted-foreground',
            !isDimmed && 'hover:text-neon-cyan transition-colors'
          )}
          title={todo.title}
        >
          {todo.title}
        </button>

        {/* Badges - inline on the same row */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Project Badge */}
          {todo.project && (
            <span
              className="px-2 py-0.5 rounded text-xs font-medium border"
              style={{
                color: todo.project.color,
                borderColor: `${todo.project.color}40`,
                backgroundColor: `${todo.project.color}10`,
              }}
            >
              {todo.project.name}
            </span>
          )}

          {/* Tag Badges */}
          {todo.tags && todo.tags.length > 0 && (
            <>
              {todo.tags.slice(0, 2).map(({ tag }) => (
                <span
                  key={tag.id}
                  className="px-1.5 py-0.5 rounded text-xs font-medium border"
                  style={{
                    color: tag.color,
                    borderColor: `${tag.color}40`,
                    backgroundColor: `${tag.color}10`,
                  }}
                >
                  #{tag.name}
                </span>
              ))}
              {todo.tags.length > 2 && (
                <span className="px-1.5 py-0.5 rounded text-xs text-muted-foreground">
                  +{todo.tags.length - 2}
                </span>
              )}
            </>
          )}

          {/* Priority Badge (compact) */}
          <PriorityBadge priority={todo.priority} />

          {/* Due Date */}
          {todo.dueDate && (
            <span
              className={cn(
                'inline-flex items-center text-xs px-1.5 py-0.5 rounded',
                isOverdue ? 'text-red-400 bg-red-500/10' : 'text-muted-foreground bg-muted/50'
              )}
              title={new Date(todo.dueDate).toLocaleString()}
            >
              <Calendar className="w-3 h-3 mr-1" />
              {formatRelativeDate(todo.dueDate)}
            </span>
          )}

          {/* Subtask Count */}
          {hasSubtasks && (
            <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
              {todo.subtasks!.filter(s => s.status === 'COMPLETED').length}/{todo.subtasks!.length}
            </span>
          )}
        </div>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(todo)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Details
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

      {/* Expanded Description */}
      {isExpanded && hasDescription && (
        <div className="pl-10 pr-2">
          <p className="text-sm text-muted-foreground">{todo.description}</p>
        </div>
      )}

      {/* Expanded Subtasks */}
      {isExpanded && hasSubtasks && (
        <div className="pl-10 pr-2 space-y-1">
          {todo.subtasks!.map(subtask => (
            <div key={subtask.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={subtask.status === 'COMPLETED'}
                onCheckedChange={() => onToggle(subtask.id)}
                className="w-4 h-4"
              />
              <span
                className={cn(
                  'text-muted-foreground',
                  subtask.status === 'COMPLETED' && 'line-through opacity-50'
                )}
              >
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
