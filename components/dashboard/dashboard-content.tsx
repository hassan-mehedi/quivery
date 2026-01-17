'use client';

import { useUIStore } from '@/stores/ui-store';
import { TodoView } from '@/components/todos/todo-view';
import { NotesView } from '@/components/notes/notes-view';
import { JsonEditorView } from '@/components/json-editor/json-editor-view';

export function DashboardContent() {
  const { currentView } = useUIStore();

  return (
    <div className="space-y-6">
      {currentView === 'todos' && <TodoView />}
      {currentView === 'notes' && <NotesView />}
      {currentView === 'json-editor' && <JsonEditorView />}
    </div>
  );
}
