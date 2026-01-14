'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { Todo } from '@prisma/client';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from './status-badge';
import { PriorityBadge } from './priority-badge';
import { SubtaskList } from './subtask-list';
import { cn, formatRelativeDate } from '@/lib/utils';
import { MoreVertical, Pencil, Trash2, Calendar } from 'lucide-react';

interface TodoCardProps {
  todo: Todo & {
    subtasks?: Todo[];
  };
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => Promise<void>;
  onCreateSubtask?: (parentId: string, title: string) => Promise<void>;
  onToggleSubtask?: (id: string) => void;
  onUpdateSubtask?: (id: string, title: string) => Promise<void>;
  onDeleteSubtask?: (id: string) => Promise<void>;
  isFocused?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  isMultiSelectMode?: boolean;
}

const TodoCardComponent = ({
  todo,
  onToggle,
  onEdit,
  onDelete,
  onUpdate,
  onCreateSubtask,
  onToggleSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  isFocused,
  isSelected,
  onSelect,
  isMultiSelectMode,
}: TodoCardProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [titleValue, setTitleValue] = useState(todo.title);
  const [descriptionValue, setDescriptionValue] = useState(todo.description || '');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  const isCompleted = todo.status === 'COMPLETED';
  const isCancelled = todo.status === 'CANCELLED';
  const isDimmed = isCompleted || isCancelled;

  const handleCardClick = (e: React.MouseEvent) => {
    // Handle multi-select with Cmd/Ctrl+click
    if (onSelect && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();
      onSelect(todo.id);
    }
  };

  // Sync local state with todo prop changes
  if (titleValue !== todo.title) setTitleValue(todo.title);
  if (descriptionValue !== (todo.description || '')) setDescriptionValue(todo.description || '');

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
      descriptionInputRef.current.select();
    }
  }, [isEditingDescription]);

  const handleTitleSave = async () => {
    if (titleValue.trim() && titleValue !== todo.title) {
      await onUpdate(todo.id, { title: titleValue.trim() });
    } else {
      setTitleValue(todo.title);
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = async () => {
    if (descriptionValue !== (todo.description || '')) {
      await onUpdate(todo.id, { description: descriptionValue || null });
    }
    setIsEditingDescription(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTitleValue(todo.title);
      setIsEditingTitle(false);
    }
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleDescriptionSave();
    } else if (e.key === 'Escape') {
      setDescriptionValue(todo.description || '');
      setIsEditingDescription(false);
    }
  };

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        'group transition-all duration-200 border-border/50 hover:border-border',
        'bg-card/50 backdrop-blur-sm hover:bg-card/80',
        isDimmed && 'opacity-60',
        isFocused && 'ring-2 ring-neon-cyan ring-offset-2 ring-offset-background',
        isSelected && 'ring-2 ring-neon-cyan bg-neon-cyan/5',
        (isMultiSelectMode || isSelected) && 'cursor-pointer'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Multi-Select Checkbox (only shown in multi-select mode or when selected) */}
          {(isMultiSelectMode || isSelected) && onSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(todo.id)}
              onClick={e => e.stopPropagation()}
              className={cn(
                'mt-1 transition-all',
                isSelected &&
                  'data-[state=checked]:bg-neon-cyan data-[state=checked]:border-neon-cyan'
              )}
            />
          )}

          {/* Status Checkbox */}
          {!(isMultiSelectMode || isSelected) && (
            <Checkbox
              checked={isCompleted}
              onCheckedChange={() => onToggle(todo.id)}
              onClick={e => e.stopPropagation()}
              className={cn(
                'mt-1 transition-all',
                isCompleted &&
                  'data-[state=checked]:bg-neon-green data-[state=checked]:border-neon-green'
              )}
            />
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              {isEditingTitle ? (
                <Input
                  ref={titleInputRef}
                  value={titleValue}
                  onChange={e => setTitleValue(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="h-auto py-1 px-2 text-base font-medium focus-neon"
                />
              ) : (
                <h3
                  onClick={() => !isDimmed && setIsEditingTitle(true)}
                  className={cn(
                    'font-medium text-foreground line-clamp-2',
                    isCompleted && 'line-through text-muted-foreground',
                    !isDimmed && 'cursor-text hover:text-neon-cyan transition-colors'
                  )}
                  title="Click to edit"
                >
                  {todo.title}
                </h3>
              )}

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
                  <DropdownMenuItem onClick={() => onEdit(todo)} className="text-foreground">
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

            {isEditingDescription ? (
              <Textarea
                ref={descriptionInputRef}
                value={descriptionValue}
                onChange={e => setDescriptionValue(e.target.value)}
                onBlur={handleDescriptionSave}
                onKeyDown={handleDescriptionKeyDown}
                className="min-h-[60px] text-sm focus-neon resize-none"
                placeholder="Add a description..."
              />
            ) : todo.description ? (
              <p
                onClick={() => !isDimmed && setIsEditingDescription(true)}
                className={cn(
                  'text-sm text-muted-foreground line-clamp-2',
                  isCompleted && 'line-through',
                  !isDimmed && 'cursor-text hover:text-foreground transition-colors'
                )}
                title="Click to edit"
              >
                {todo.description}
              </p>
            ) : (
              !isDimmed && (
                <p
                  onClick={() => setIsEditingDescription(true)}
                  className="text-sm text-muted-foreground/60 cursor-text hover:text-muted-foreground transition-colors"
                  title="Click to add description"
                >
                  Add description...
                </p>
              )
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

            {/* Subtasks */}
            {todo.subtasks &&
              todo.subtasks.length > 0 &&
              onCreateSubtask &&
              onToggleSubtask &&
              onUpdateSubtask &&
              onDeleteSubtask && (
                <SubtaskList
                  subtasks={todo.subtasks}
                  parentId={todo.id}
                  onCreateSubtask={onCreateSubtask}
                  onToggleSubtask={onToggleSubtask}
                  onUpdateSubtask={onUpdateSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                />
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const TodoCard = memo(TodoCardComponent);
