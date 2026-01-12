'use client';

import { useEffect, useCallback } from 'react';
import { useProjectStore } from '@/stores/project-store';
import { Project } from '@prisma/client';
import { toast } from 'sonner';

export function useProjects() {
  const {
    projects,
    isLoading,
    error,
    selectedProjectId,
    setProjects,
    addProject,
    updateProject,
    deleteProject,
    setSelectedProjectId,
    setLoading,
    setError,
  } = useProjectStore();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects');

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [setProjects, setLoading, setError]);

  const createProject = useCallback(
    async (data: {
      name: string;
      color?: string;
      icon?: string;
    }) => {
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create project');
        }

        const project = await response.json();
        addProject(project);
        toast.success('Project created successfully');
        return project;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create project';
        toast.error(message);
        throw err;
      }
    },
    [addProject]
  );

  const editProject = useCallback(
    async (id: string, data: Partial<Project>) => {
      try {
        const response = await fetch(`/api/projects/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update project');
        }

        const project = await response.json();
        updateProject(id, project);
        toast.success('Project updated successfully');
        return project;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update project';
        toast.error(message);
        throw err;
      }
    },
    [updateProject]
  );

  const removeProject = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/projects/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete project');
        }

        deleteProject(id);
        toast.success('Project deleted successfully');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete project';
        toast.error(message);
        throw err;
      }
    },
    [deleteProject]
  );

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    isLoading,
    error,
    selectedProjectId,
    setSelectedProjectId,
    createProject,
    editProject,
    removeProject,
    refetch: fetchProjects,
  };
}
