'use client';

import { useState, useRef, useEffect } from 'react';
import { Todo } from '@prisma/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface SubtaskItemProps {
  subtask: Todo;
  onToggle: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function SubtaskItem({ subtask, onToggle, onUpdate, onDelete }: SubtaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(subtask.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const isCompleted = subtask.status === 'COMPLETED';

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (title.trim() && title !== subtask.title) {
      onUpdate(subtask.id, title.trim());
    } else {
      setTitle(subtask.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setTitle(subtask.title);
      setIsEditing(false);
    }
  };

  return (
    <div className="group flex items-center gap-2 py-1">
      {/* Checkbox */}
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() => onToggle(subtask.id)}
        className="w-4 h-4 shrink-0"
      />

      {/* Title */}
      {isEditing ? (
        <Input
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm py-1 px-2"
        />
      ) : (
        <span
          onClick={() => !isCompleted && setIsEditing(true)}
          className={cn(
            'flex-1 text-sm cursor-text',
            isCompleted
              ? 'line-through text-muted-foreground opacity-60'
              : 'text-foreground hover:text-neon-cyan transition-colors'
          )}
          title="Click to edit"
        >
          {subtask.title}
        </span>
      )}

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={() => onDelete(subtask.id)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
