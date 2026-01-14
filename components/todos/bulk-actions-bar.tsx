'use client';

import { useState } from 'react';
import { Priority } from '@prisma/client';
import { useTodoStore } from '@/stores/todo-store';
import { useProjects } from '@/hooks/use-projects';
import { useTags } from '@/hooks/use-tags';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, FolderOpen, Tag, Trash2, X, Loader2, Flag } from 'lucide-react';
import { toast } from 'sonner';

export function BulkActionsBar() {
  const selectedTodoIds = useTodoStore(state => state.selectedTodoIds);
  const clearSelection = useTodoStore(state => state.clearSelection);
  const bulkUpdateStatus = useTodoStore(state => state.bulkUpdateStatus);
  const bulkDelete = useTodoStore(state => state.bulkDelete);
  const bulkAssignProject = useTodoStore(state => state.bulkAssignProject);
  const bulkAddTags = useTodoStore(state => state.bulkAddTags);
  const bulkSetPriority = useTodoStore(state => state.bulkSetPriority);

  const { projects } = useProjects();
  const { tags } = useTags();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedIds = Array.from(selectedTodoIds);
  const selectedCount = selectedIds.length;

  if (selectedCount === 0) return null;

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await bulkUpdateStatus(selectedIds, 'COMPLETED');
      toast.success(`${selectedCount} todo(s) marked as complete`);
      clearSelection();
    } catch {
      toast.error('Failed to complete todos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUncomplete = async () => {
    setIsLoading(true);
    try {
      await bulkUpdateStatus(selectedIds, 'PENDING');
      toast.success(`${selectedCount} todo(s) marked as pending`);
      clearSelection();
    } catch {
      toast.error('Failed to update todos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await bulkDelete(selectedIds);
      toast.success(`${selectedCount} todo(s) deleted`);
      setShowDeleteDialog(false);
      clearSelection();
    } catch {
      toast.error('Failed to delete todos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignProject = async (projectId: string) => {
    setIsLoading(true);
    try {
      await bulkAssignProject(selectedIds, projectId === 'none' ? null : projectId);
      const project = projects.find(p => p.id === projectId);
      toast.success(
        `${selectedCount} todo(s) ${projectId === 'none' ? 'removed from project' : `assigned to ${project?.name}`}`
      );
      clearSelection();
    } catch {
      toast.error('Failed to assign project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTags = async (tagId: string) => {
    setIsLoading(true);
    try {
      await bulkAddTags(selectedIds, [tagId]);
      const tag = tags.find(t => t.id === tagId);
      toast.success(`Tag "${tag?.name}" added to ${selectedCount} todo(s)`);
      clearSelection();
    } catch {
      toast.error('Failed to add tags');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPriority = async (priority: Priority) => {
    setIsLoading(true);
    try {
      await bulkSetPriority(selectedIds, priority);
      toast.success(`${selectedCount} todo(s) updated to ${priority} priority`);
      clearSelection();
    } catch {
      toast.error('Failed to update priority');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md shadow-lg animate-in slide-in-from-bottom-2">
        <div className="container max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Selection Count */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                <span className="text-neon-cyan">{selectedCount}</span> selected
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Complete/Uncomplete */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    className="hover:border-neon-green hover:text-neon-green"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleComplete}>Mark as Complete</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleUncomplete}>Mark as Pending</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Set Priority */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    className="hover:border-neon-pink hover:text-neon-pink"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Priority
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleSetPriority('URGENT')}>
                    <span className="text-red-500">Urgent</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSetPriority('HIGH')}>
                    <span className="text-orange-500">High</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSetPriority('MEDIUM')}>
                    <span className="text-yellow-500">Medium</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSetPriority('LOW')}>
                    <span className="text-blue-500">Low</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Assign Project */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    className="hover:border-neon-cyan hover:text-neon-cyan"
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Project
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto">
                  <DropdownMenuLabel>Assign to Project</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleAssignProject('none')}>
                    <span className="text-muted-foreground">No Project</span>
                  </DropdownMenuItem>
                  {projects.map(project => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => handleAssignProject(project.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <span>{project.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Add Tags */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    className="hover:border-neon-pink hover:text-neon-pink"
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    Add Tags
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto">
                  <DropdownMenuLabel>Add Tag</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {tags.map(tag => (
                    <DropdownMenuItem key={tag.id} onClick={() => handleAddTags(tag.id)}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>#{tag.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Delete */}
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => setShowDeleteDialog(true)}
                className="hover:border-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>

              {/* Clear Selection */}
              <Button
                variant="ghost"
                size="sm"
                disabled={isLoading}
                onClick={clearSelection}
                className="hover:bg-muted"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} Todo(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} todo(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
