'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ProjectBadgeProps {
  project: {
    id: string;
    name: string;
    color: string;
    icon?: string | null;
  };
  size?: 'default' | 'sm' | 'xs';
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function ProjectBadge({
  project,
  size = 'default',
  onClick,
  onRemove,
  className,
}: ProjectBadgeProps) {
  const sizeClasses = {
    default: 'px-2.5 py-1 text-sm',
    sm: 'px-2 py-0.5 text-xs',
    xs: 'px-1.5 py-0.5 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium border transition-all',
        'hover:brightness-110',
        sizeClasses[size],
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        color: project.color,
        borderColor: `${project.color}40`,
        backgroundColor: `${project.color}10`,
      }}
      onClick={onClick}
      title={project.name}
    >
      {project.icon && <span className="shrink-0">{project.icon}</span>}
      <span className="truncate max-w-[120px]">{project.name}</span>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 hover:bg-transparent shrink-0"
          onClick={e => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </span>
  );
}
