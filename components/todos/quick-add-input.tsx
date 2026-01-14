'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Calendar, AlertCircle, Folder, Hash } from 'lucide-react';
import { parseNaturalLanguage } from '@/lib/natural-language-parser';
import { Priority } from '@prisma/client';
import { useProjects } from '@/hooks/use-projects';

interface QuickAddInputProps {
  onSubmit: (data: {
    title: string;
    priority?: Priority;
    dueDate?: string;
    projectId?: string;
    tagIds?: string[];
  }) => Promise<void>;
  onCancel: () => void;
  isVisible: boolean;
}

export function QuickAddInput({ onSubmit, onCancel, isVisible }: QuickAddInputProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useNLP, setUseNLP] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const { projects } = useProjects();

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  // Parse input with NLP
  const parsed = useMemo(() => {
    if (!title.trim() || !useNLP) return null;
    return parseNaturalLanguage(title);
  }, [title, useNLP]);

  // Find project by name
  const matchedProject = useMemo(() => {
    if (!parsed?.projectName) return null;
    return projects.find(p => p.name.toLowerCase() === parsed.projectName?.toLowerCase());
  }, [parsed?.projectName, projects]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (useNLP && parsed) {
        // Submit with parsed values
        await onSubmit({
          title: parsed.title,
          priority: parsed.priority,
          dueDate: parsed.dueDate?.toISOString().split('T')[0],
          projectId: matchedProject?.id,
          tagIds: parsed.tags,
        });
      } else {
        // Submit literal text
        await onSubmit({ title: title.trim() });
      }
      setTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
      setTitle('');
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      // Cmd/Ctrl+Enter to submit without parsing
      e.preventDefault();
      setUseNLP(false);
      handleSubmit();
      setUseNLP(true);
    }
  };

  if (!isVisible) return null;

  const showPreview = useNLP && parsed && title.trim();

  return (
    <Card className="border-neon-cyan/50 bg-card/80 backdrop-blur-sm shadow-lg">
      <CardContent className="p-3 space-y-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              ref={inputRef}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done? Try: Buy milk tomorrow #shopping !high"
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

        {/* Preview */}
        {showPreview && (
          <div className="bg-muted/50 rounded-lg p-2 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">Preview:</span>
              <span className="text-foreground">{parsed.title}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {parsed.dueDate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan rounded">
                  <Calendar className="w-3 h-3" />
                  {parsed.dueDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
              {parsed.priority && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">
                  <AlertCircle className="w-3 h-3" />
                  {parsed.priority}
                </span>
              )}
              {matchedProject && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${matchedProject.color}10`,
                    color: matchedProject.color,
                  }}
                >
                  <Folder className="w-3 h-3" />
                  {matchedProject.name}
                </span>
              )}
              {parsed.projectName && !matchedProject && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground rounded">
                  <Folder className="w-3 h-3" />@{parsed.projectName} (not found)
                </span>
              )}
              {parsed.tags &&
                parsed.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded"
                  >
                    <Hash className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to add
          {' • '}
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Cmd/Ctrl+Enter</kbd> for literal
          {' • '}
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to cancel
        </p>
      </CardContent>
    </Card>
  );
}
