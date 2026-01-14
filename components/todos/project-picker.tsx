'use client';

import { useState, useMemo } from 'react';
import { useProjects } from '@/hooks/use-projects';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProjectId?: string | null;
  onSelect: (projectId: string | null) => void;
}

const PROJECT_COLORS = [
  '#8B5CF6', // Purple (default)
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Green
  '#EF4444', // Red
  '#6366F1', // Indigo
  '#F97316', // Orange
];

const PROJECT_ICONS = ['📁', '💼', '🎯', '🚀', '⭐', '📌', '🏠', '💡'];

export function ProjectPicker({
  open,
  onOpenChange,
  selectedProjectId,
  onSelect,
}: ProjectPickerProps) {
  const { projects, createProject } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(PROJECT_ICONS[0]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(p => p.name.toLowerCase().includes(query));
  }, [projects, searchQuery]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const project = await createProject({
        name: newProjectName.trim(),
        color: selectedColor,
        icon: selectedIcon,
      });
      onSelect(project.id);
      setIsCreating(false);
      setNewProjectName('');
      setSelectedColor(PROJECT_COLORS[0]);
      setSelectedIcon(PROJECT_ICONS[0]);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleSelect = (projectId: string | null) => {
    onSelect(projectId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Select Project</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose a project to organize your todo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          {!isCreating && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Project List or Create Form */}
          {isCreating ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="Enter project name"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_COLORS.map(color => (
                    <button
                      key={color}
                      className={cn(
                        'w-8 h-8 rounded-md border-2 transition-all',
                        selectedColor === color
                          ? 'border-foreground scale-110'
                          : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Icon (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_ICONS.map(icon => (
                    <button
                      key={icon}
                      className={cn(
                        'w-10 h-10 rounded-md border-2 text-xl transition-all',
                        'hover:bg-muted',
                        selectedIcon === icon
                          ? 'border-foreground bg-muted scale-110'
                          : 'border-border'
                      )}
                      onClick={() => setSelectedIcon(icon)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateProject} className="flex-1 text-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                  className="text-foreground"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {/* None option */}
                  <button
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
                      'hover:bg-muted',
                      !selectedProjectId ? 'border-neon-cyan bg-neon-cyan/10' : 'border-border'
                    )}
                    onClick={() => handleSelect(null)}
                  >
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                      <Folder className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-foreground">No Project</div>
                      <div className="text-xs text-muted-foreground">Inbox</div>
                    </div>
                  </button>

                  {/* Project list */}
                  {filteredProjects.length === 0 && searchQuery ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No projects found
                    </div>
                  ) : (
                    filteredProjects.map(project => (
                      <button
                        key={project.id}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
                          'hover:bg-muted',
                          selectedProjectId === project.id
                            ? 'border-neon-cyan bg-neon-cyan/10'
                            : 'border-border'
                        )}
                        onClick={() => handleSelect(project.id)}
                      >
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${project.color}20` }}
                        >
                          {project.icon || '📁'}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-foreground">{project.name}</div>
                          {project._count && (
                            <div className="text-xs text-muted-foreground">
                              {project._count.todos} todo{project._count.todos !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>

              <Button
                variant="outline"
                className="w-full text-foreground"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Project
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
