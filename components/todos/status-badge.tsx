import { TodoStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';

const statusConfig: Record<
  TodoStatus,
  {
    label: string;
    icon: typeof Clock;
    className: string;
  }
> = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: PlayCircle,
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  },
};

interface StatusBadgeProps {
  status: TodoStatus;
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}
