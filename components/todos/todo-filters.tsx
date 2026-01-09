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
import { X } from 'lucide-react';

interface TodoFiltersProps {
  status: TodoStatus | 'ALL';
  priority: Priority | 'ALL';
  onStatusChange: (status: TodoStatus | 'ALL') => void;
  onPriorityChange: (priority: Priority | 'ALL') => void;
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
  onStatusChange,
  onPriorityChange,
  onClear,
}: TodoFiltersProps) {
  const hasFilters = status !== 'ALL' || priority !== 'ALL';

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
