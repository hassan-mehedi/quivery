'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAddInputProps {
  onSubmit: (title: string) => Promise<void>;
  onCancel: () => void;
  isVisible: boolean;
}

export function QuickAddInput({ onSubmit, onCancel, isVisible }: QuickAddInputProps) {
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
      setTitle('');
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="border-neon-cyan/50 bg-card/80 backdrop-blur-sm shadow-lg">
      <CardContent className="p-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              ref={inputRef}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done? (Press Esc to cancel)"
              className="focus-neon border-border/50 text-foreground"
              disabled={isSubmitting}
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={!title.trim() || isSubmitting}
            className="neon-glow-cyan"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              onCancel();
              setTitle('');
            }}
            disabled={isSubmitting}
          >
            <X className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Tip: Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to add,{' '}
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to cancel
        </p>
      </CardContent>
    </Card>
  );
}
