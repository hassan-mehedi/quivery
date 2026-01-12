'use client';

import { useState, useEffect, useMemo } from 'react';
import { Todo, TodoStatus, Priority, Tag } from '@prisma/client';
import { parseNaturalLanguage } from '@/lib/natural-language-parser';
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
import { ProjectPicker } from './project-picker';
import { TagPicker } from './tag-picker';
import { ProjectBadge } from './project-badge';
import { useProjects } from '@/hooks/use-projects';
import { Loader2, Folder } from 'lucide-react';

interface TodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo?: (Todo & {
    project?: { id: string; name: string; color: string; icon?: string | null } | null;
    tags?: Array<{ tag: { id: string; name: string; color: string } }>;
  }) | null;
  onSubmit: (data: {
    title: string;
    description?: string;
    status: TodoStatus;
    priority: Priority;
    dueDate?: string;
    projectId?: string;
    tagIds?: string[];
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
  const { projects } = useProjects();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TodoStatus>('PENDING');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const isEditing = !!todo;
  const [hasManuallyEdited, setHasManuallyEdited] = useState(false);

  // Parse title on initial load (for new todos only)
  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || '');
      setStatus(todo.status);
      setPriority(todo.priority);
      setDueDate(todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '');
      setProjectId(todo.project?.id || null);
      setTagIds(todo.tags?.map(t => t.tag.id) || []);
      setHasManuallyEdited(true);
    } else {
      setTitle('');
      setDescription('');
      setStatus('PENDING');
      setPriority('MEDIUM');
      setDueDate('');
      setProjectId(null);
      setTagIds([]);
      setHasManuallyEdited(false);
    }
  }, [todo, open]);

  // Auto-parse title when creating a new todo
  useEffect(() => {
    if (!isEditing && !hasManuallyEdited && title.trim()) {
      const parsed = parseNaturalLanguage(title);

      if (parsed.title !== title.trim()) {
        setTitle(parsed.title);
      }

      if (parsed.priority && parsed.priority !== priority) {
        setPriority(parsed.priority);
      }

      if (parsed.dueDate && !dueDate) {
        setDueDate(parsed.dueDate.toISOString().split('T')[0]);
      }

      if (parsed.projectName) {
        const matchedProject = projects.find(
          p => p.name.toLowerCase() === parsed.projectName?.toLowerCase()
        );
        if (matchedProject && matchedProject.id !== projectId) {
          setProjectId(matchedProject.id);
        }
      }
    }
  }, [title, isEditing, hasManuallyEdited, projects, priority, dueDate, projectId]);

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
        projectId: projectId || undefined,
        tagIds: tagIds.length > 0 ? tagIds : undefined,
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProject = projects.find(p => p.id === projectId);

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
              placeholder="What needs to be done? Try: Buy milk tomorrow !high"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Project</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowProjectPicker(true)}
              >
                {selectedProject ? (
                  <ProjectBadge project={selectedProject} size="sm" />
                ) : (
                  <>
                    <Folder className="w-4 h-4 mr-2" />
                    <span className="text-muted-foreground">Select project</span>
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Tags</Label>
              <TagPicker selectedTagIds={tagIds} onChange={setTagIds} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-4">
              <Label className="text-foreground">Status</Label>
              <Select
                value={status}
                onValueChange={v => {
                  setStatus(v as TodoStatus);
                  setHasManuallyEdited(true);
                }}
              >
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
              <Select
                value={priority}
                onValueChange={v => {
                  setPriority(v as Priority);
                  setHasManuallyEdited(true);
                }}
              >
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
                onChange={e => {
                  setDueDate(e.target.value);
                  setHasManuallyEdited(true);
                }}
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

      <ProjectPicker
        open={showProjectPicker}
        onOpenChange={setShowProjectPicker}
        selectedProjectId={projectId}
        onSelect={setProjectId}
      />
    </Dialog>
  );
}
