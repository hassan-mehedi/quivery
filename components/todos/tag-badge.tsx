'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TagBadgeProps {
  tag: {
    id: string;
    name: string;
    color: string;
  };
  size?: 'default' | 'sm' | 'xs';
  onClick?: () => void;
  onRemove?: () => void;
  showHash?: boolean;
  className?: string;
}

export function TagBadge({
  tag,
  size = 'default',
  onClick,
  onRemove,
  showHash = true,
  className,
}: TagBadgeProps) {
  const sizeClasses = {
    default: 'px-2 py-1 text-xs',
    sm: 'px-1.5 py-0.5 text-xs',
    xs: 'px-1.5 py-0.5 text-[10px]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded font-medium border transition-all',
        'hover:brightness-110',
        sizeClasses[size],
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        color: tag.color,
        borderColor: `${tag.color}40`,
        backgroundColor: `${tag.color}10`,
      }}
      onClick={onClick}
      title={tag.name}
    >
      <span className="truncate max-w-[100px]">
        {showHash && '#'}
        {tag.name}
      </span>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-3 w-3 p-0 hover:bg-transparent shrink-0"
          onClick={e => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-2.5 w-2.5" />
        </Button>
      )}
    </span>
  );
}
