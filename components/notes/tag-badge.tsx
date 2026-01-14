'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tag } from '@prisma/client';

interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function TagBadge({
  tag,
  onRemove,
  selected,
  onClick,
  className,
  size = 'md',
}: TagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium transition-all',
        'border',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs',
        selected && 'ring-2 ring-offset-2 ring-offset-background',
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      style={{
        backgroundColor: `${tag.color}20`,
        borderColor: `${tag.color}50`,
        color: tag.color,
        ...(selected && ({ '--tw-ring-color': tag.color } as React.CSSProperties)),
      }}
      onClick={onClick}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-black/10 rounded-sm p-0.5 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
