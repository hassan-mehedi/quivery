'use client';

import { useState } from 'react';
import { Todo } from '@prisma/client';
import { SubtaskItem } from './subtask-item';
import { QuickAddSubtask } from './quick-add-subtask';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubtaskListProps {
  subtasks: Todo[];
  parentId: string;
  onCreateSubtask: (parentId: string, title: string) => Promise<void>;
  onToggleSubtask: (id: string) => void;
  onUpdateSubtask: (id: string, title: string) => Promise<void>;
  onDeleteSubtask: (id: string) => Promise<void>;
  isCollapsed?: boolean;
}

export function SubtaskList({
  subtasks,
  parentId,
  onCreateSubtask,
  onToggleSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  isCollapsed = false,
}: SubtaskListProps) {
  const [showAddSubtask, setShowAddSubtask] = useState(false);

  const handleCreateSubtask = async (title: string) => {
    await onCreateSubtask(parentId, title);
    setShowAddSubtask(false);
  };

  const completedCount = subtasks.filter(s => s.status === 'COMPLETED').length;
  const totalCount = subtasks.length;

  if (isCollapsed && totalCount === 0) return null;

  return (
    <div className="pl-6 space-y-1">
      {/* Progress indicator */}
      {totalCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-neon-cyan transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
          <span>
            {completedCount}/{totalCount}
          </span>
        </div>
      )}

      {/* Subtask items */}
      {!isCollapsed && (
        <>
          {subtasks.map(subtask => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              onToggle={onToggleSubtask}
              onUpdate={onUpdateSubtask}
              onDelete={onDeleteSubtask}
            />
          ))}

          {/* Quick add subtask */}
          <QuickAddSubtask
            isVisible={showAddSubtask}
            onSubmit={handleCreateSubtask}
            onCancel={() => setShowAddSubtask(false)}
          />

          {/* Add subtask button */}
          {!showAddSubtask && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddSubtask(true)}
              className="h-7 text-xs text-muted-foreground hover:text-foreground -ml-2"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add subtask
            </Button>
          )}
        </>
      )}
    </div>
  );
}
