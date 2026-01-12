'use client';

import { TodoStatus, Priority } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/use-projects';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Tag } from '@prisma/client';

interface TodoFiltersProps {
  status: TodoStatus | 'ALL';
  priority: Priority | 'ALL';
  projectId: string | 'ALL';
  tagIds: string[];
  onStatusChange: (status: TodoStatus | 'ALL') => void;
  onPriorityChange: (priority: Priority | 'ALL') => void;
  onProjectChange: (projectId: string | 'ALL') => void;
  onTagChange: (tagIds: string[]) => void;
  onClear: () => void;
}

const statusOptions = [
  { value: 'ALL', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const priorityOptions = [
  { value: 'ALL', label: 'All Priority' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

export function TodoFilters({
  status,
  priority,
  projectId,
  tagIds,
  onStatusChange,
  onPriorityChange,
  onProjectChange,
  onTagChange,
  onClear,
}: TodoFiltersProps) {
  const { projects } = useProjects();
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    // Fetch tags
    fetch('/api/tags')
      .then(res => res.ok ? res.json() : [])
      .then(data => setTags(data))
      .catch(() => setTags([]));
  }, []);

  const hasFilters =
    status !== 'ALL' ||
    priority !== 'ALL' ||
    projectId !== 'ALL' ||
    tagIds.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[140px] h-9 text-sm" suppressHydrationWarning>
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

      <Select value={priority} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[140px] h-9 text-sm" suppressHydrationWarning>
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

      <Select value={projectId} onValueChange={onProjectChange}>
        <SelectTrigger className="w-[140px] h-9 text-sm" suppressHydrationWarning>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Projects</SelectItem>
          {projects.map(project => (
            <SelectItem key={project.id} value={project.id}>
              {project.icon} {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={tagIds.length > 0 ? tagIds[0] : 'ALL'}
        onValueChange={(value) => onTagChange(value === 'ALL' ? [] : [value])}
      >
        <SelectTrigger className="w-[140px] h-9 text-sm" suppressHydrationWarning>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Tags</SelectItem>
          {tags.map(tag => (
            <SelectItem key={tag.id} value={tag.id}>
              #{tag.name}
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
  );
}
