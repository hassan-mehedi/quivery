'use client';

import { useState, useEffect } from 'react';
import { Todo, TodoStatus, Priority } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface TodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo?: Todo | null;
  onSubmit: (data: {
    title: string;
    description?: string;
    status: TodoStatus;
    priority: Priority;
    dueDate?: string;
  }) => Promise<void>;
}

const statusOptions: { value: TodoStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

export function TodoDialog({ open, onOpenChange, todo, onSubmit }: TodoDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TodoStatus>('PENDING');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!todo;

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || '');
      setStatus(todo.status);
      setPriority(todo.priority);
      setDueDate(todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('PENDING');
      setPriority('MEDIUM');
      setDueDate('');
    }
  }, [todo, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit({
        title,
        description: description || undefined,
        status,
        priority,
        dueDate: dueDate || undefined,
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Todo' : 'Create Todo'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <Label htmlFor="title" className="text-foreground">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              className="focus-neon text-foreground"
            />
          </div>

          <div className="space-y-4">
            <Label htmlFor="description" className="text-foreground">
              Description (optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="focus-neon resize-none text-foreground"
            />
          </div>

          <div className="grid grid-cols-3">
            <div className="space-y-4">
              <Label className="text-foreground">Status</Label>
              <Select value={status} onValueChange={v => setStatus(v as TodoStatus)}>
                <SelectTrigger className="focus-neon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-foreground">Priority</Label>
              <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
                <SelectTrigger className="focus-neon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label htmlFor="dueDate" className="text-foreground">
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="focus-neon text-foreground [color-scheme:dark]"
              />
            </div>
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
                  {isEditing ? 'Saving...' : 'Creating...'}
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Todo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
