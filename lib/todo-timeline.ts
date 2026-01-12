import {
  startOfDay,
  endOfDay,
  addDays,
  isBefore,
  isAfter,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { Todo, TodoStatus } from '@prisma/client';

export interface TimelineGroup {
  overdue: Todo[];
  today: Todo[];
  tomorrow: Todo[];
  thisWeek: Todo[];
  later: Todo[];
  noDate: Todo[];
}

export interface TimelineSectionInfo {
  id: string;
  title: string;
  color: string;
  count: number;
}

export function groupTodosByTimeline(todos: Todo[]): TimelineGroup {
  const now = new Date();
  const today = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrow = addDays(today, 1);
  const tomorrowEnd = endOfDay(tomorrow);
  const dayAfterTomorrow = addDays(tomorrow, 1);
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Week starts on Monday

  const groups: TimelineGroup = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
    noDate: [],
  };

  todos.forEach(todo => {
    // Skip completed todos (they can be shown in a separate "Completed" view)
    if (todo.status === 'COMPLETED') {
      return;
    }

    if (!todo.dueDate) {
      groups.noDate.push(todo);
      return;
    }

    const dueDate = new Date(todo.dueDate);

    // Overdue: before today
    if (isBefore(dueDate, today)) {
      groups.overdue.push(todo);
    }
    // Today: same day as today
    else if (isSameDay(dueDate, now)) {
      groups.today.push(todo);
    }
    // Tomorrow: next day
    else if (isSameDay(dueDate, tomorrow)) {
      groups.tomorrow.push(todo);
    }
    // This week: between day after tomorrow and end of week
    else if (
      (isAfter(dueDate, tomorrowEnd) || isSameDay(dueDate, dayAfterTomorrow)) &&
      isBefore(dueDate, weekEnd)
    ) {
      groups.thisWeek.push(todo);
    }
    // Later: after this week
    else if (isAfter(dueDate, weekEnd)) {
      groups.later.push(todo);
    }
  });

  return groups;
}

export function getTimelineSections(groups: TimelineGroup): TimelineSectionInfo[] {
  return [
    {
      id: 'overdue',
      title: 'Overdue',
      color: 'red',
      count: groups.overdue.length,
    },
    {
      id: 'today',
      title: 'Today',
      color: 'cyan',
      count: groups.today.length,
    },
    {
      id: 'tomorrow',
      title: 'Tomorrow',
      color: 'purple',
      count: groups.tomorrow.length,
    },
    {
      id: 'thisWeek',
      title: 'This Week',
      color: 'blue',
      count: groups.thisWeek.length,
    },
    {
      id: 'later',
      title: 'Later',
      color: 'gray',
      count: groups.later.length,
    },
    {
      id: 'noDate',
      title: 'No Date',
      color: 'gray',
      count: groups.noDate.length,
    },
  ].filter(section => section.count > 0); // Only show sections with todos
}
