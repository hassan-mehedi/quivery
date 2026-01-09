import { Priority } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

const priorityConfig: Record<
  Priority,
  {
    label: string;
    icon: typeof AlertTriangle;
    className: string;
  }
> = {
  URGENT: {
    label: 'Urgent',
    icon: AlertTriangle,
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  HIGH: {
    label: 'High',
    icon: ArrowUp,
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  MEDIUM: {
    label: 'Medium',
    icon: ArrowRight,
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  LOW: {
    label: 'Low',
    icon: ArrowDown,
    className: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  },
};

interface PriorityBadgeProps {
  priority: Priority;
  showIcon?: boolean;
  className?: string;
}

export function PriorityBadge({ priority, showIcon = true, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}
