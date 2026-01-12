'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Todo } from '@prisma/client';
import { TodoCard } from './todo-card';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableTodoCardProps {
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

export function DraggableTodoCard(props: DraggableTodoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'cursor-grab active:cursor-grabbing',
          'text-muted-foreground hover:text-foreground',
          'p-2 rounded',
          'focus:outline-none focus:ring-2 focus:ring-neon-cyan'
        )}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Todo Card */}
      <TodoCard {...props} />
    </div>
  );
}
