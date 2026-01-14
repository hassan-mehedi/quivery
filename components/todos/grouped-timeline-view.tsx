'use client';

import { useMemo } from 'react';
import { Todo } from '@prisma/client';
import { useTodoStore } from '@/stores/todo-store';
import { groupTodosByTimeline, getTimelineSections } from '@/lib/todo-timeline';
import { TimelineSection } from './timeline-section';
import { TodoCardCompact } from './todo-card-compact';
import { EmptyState } from '@/components/ui/empty-state';
import { CheckSquare } from 'lucide-react';

interface GroupedTimelineViewProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  focusedTodoId: string | null;
}

export function GroupedTimelineView({
  todos,
  onToggle,
  onEdit,
  onDelete,
  focusedTodoId,
}: GroupedTimelineViewProps) {
  const {
    expandedSections,
    toggleSection,
    selectedTodoIds,
    toggleTodoSelection,
    isMultiSelectMode,
  } = useTodoStore();

  // Group todos by timeline
  const groups = useMemo(() => groupTodosByTimeline(todos), [todos]);

  // Get section information
  const sections = useMemo(() => getTimelineSections(groups), [groups]);

  // If no todos, show empty state
  if (sections.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No todos to show"
        description="All your tasks are complete, or you haven't added any todos yet."
      />
    );
  }

  const colorMap: Record<string, 'red' | 'cyan' | 'purple' | 'blue' | 'gray'> = {
    overdue: 'red',
    today: 'cyan',
    tomorrow: 'purple',
    thisWeek: 'blue',
    later: 'gray',
    noDate: 'gray',
  };

  return (
    <div className="space-y-4">
      {sections.map(section => {
        const sectionTodos = groups[section.id as keyof typeof groups];
        const isExpanded = expandedSections.has(section.id);

        return (
          <TimelineSection
            key={section.id}
            title={section.title}
            count={section.count}
            color={colorMap[section.id]}
            isExpanded={isExpanded}
            onToggle={() => toggleSection(section.id)}
          >
            <div className="space-y-2">
              {sectionTodos.map(todo => (
                <TodoCardCompact
                  key={todo.id}
                  todo={todo}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isFocused={focusedTodoId === todo.id}
                  isSelected={selectedTodoIds.has(todo.id)}
                  onSelect={toggleTodoSelection}
                  isMultiSelectMode={isMultiSelectMode}
                />
              ))}
            </div>
          </TimelineSection>
        );
      })}
    </div>
  );
}
