'use client';

import { ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineSectionProps {
  title: string;
  count: number;
  color: 'red' | 'cyan' | 'purple' | 'blue' | 'gray';
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

const colorClasses = {
  red: 'text-red-500 border-red-500/30 bg-red-500/5',
  cyan: 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/5',
  purple: 'text-neon-pink border-neon-pink/30 bg-neon-pink/5',
  blue: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  gray: 'text-muted-foreground border-border/30 bg-muted/5',
};

export function TimelineSection({
  title,
  count,
  color,
  isExpanded,
  onToggle,
  children,
}: TimelineSectionProps) {
  return (
    <div className="space-y-2">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg',
          'transition-all duration-200 hover:bg-card/50',
          'border border-transparent',
          isExpanded && colorClasses[color]
        )}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="font-semibold text-sm uppercase tracking-wide text-foreground">
            {title}
          </span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              'bg-muted text-muted-foreground'
            )}
          >
            {count}
          </span>
        </div>
      </button>

      {/* Section Content */}
      {isExpanded && <div className="space-y-2 pl-2">{children}</div>}
    </div>
  );
}
