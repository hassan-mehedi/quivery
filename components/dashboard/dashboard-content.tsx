'use client';

import { useUIStore } from '@/stores/ui-store';
import { TodoView } from '@/components/todos/todo-view';
import { NotesView } from '@/components/notes/notes-view';

export function DashboardContent() {
  const { currentView } = useUIStore();

  return <div className="space-y-6">{currentView === 'todos' ? <TodoView /> : <NotesView />}</div>;
}
