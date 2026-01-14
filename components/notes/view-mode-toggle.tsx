'use client';

import { Grid3x3, List, Rows3 } from 'lucide-react';

interface ViewModeToggleProps {
  mode: 'grid' | 'list' | 'compact';
  onChange: (mode: 'grid' | 'list' | 'compact') => void;
}

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  const modes = [
    { value: 'grid' as const, icon: Grid3x3, label: 'Grid view' },
    { value: 'list' as const, icon: List, label: 'List view' },
    { value: 'compact' as const, icon: Rows3, label: 'Compact view' },
  ];

  return (
    <div className="inline-flex items-center border border-border rounded-lg overflow-hidden divide-x divide-border">
      {modes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`
            px-3 py-1.5 transition-all duration-200
            hover:bg-accent/80
            ${
              mode === value ? 'bg-primary/20 text-primary' : 'bg-transparent text-muted-foreground'
            }
          `}
          title={label}
          aria-label={label}
          aria-pressed={mode === value}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
