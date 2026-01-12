'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAddSubtaskProps {
  onSubmit: (title: string) => Promise<void>;
  onCancel: () => void;
  isVisible: boolean;
}

export function QuickAddSubtask({ onSubmit, onCancel, isVisible }: QuickAddSubtaskProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(title.trim());
      setTitle('');
    } catch (error) {
      console.error('Failed to create subtask:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setTitle('');
      onCancel();
    }
  };

  if (!isVisible) return null;

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 py-1">
      <div className="w-4 shrink-0" /> {/* Spacer to align with checkbox */}
      <Input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a subtask..."
        disabled={isSubmitting}
        className="h-7 text-sm py-1 px-2 flex-1"
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        disabled={!title.trim() || isSubmitting}
        className="h-5 w-5 shrink-0"
      >
        <Plus className="h-3 w-3" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onCancel}
        className="h-5 w-5 shrink-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </form>
  );
}
