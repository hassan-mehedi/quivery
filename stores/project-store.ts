import { create } from 'zustand';
import { Project } from '@prisma/client';

interface ProjectWithCount extends Project {
  _count?: {
    todos: number;
  };
}

interface ProjectState {
  projects: ProjectWithCount[];
  isLoading: boolean;
  error: string | null;
  selectedProjectId: string | null;
  setProjects: (projects: ProjectWithCount[]) => void;
  addProject: (project: ProjectWithCount) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setSelectedProjectId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProjectStore = create<ProjectState>(set => ({
  projects: [],
  isLoading: false,
  error: null,
  selectedProjectId: null,
  setProjects: projects => set({ projects }),
  addProject: project => set(state => ({ projects: [project, ...state.projects] })),
  updateProject: (id, updates) =>
    set(state => ({
      projects: state.projects.map(p => (p.id === id ? { ...p, ...updates } : p)),
    })),
  deleteProject: id =>
    set(state => ({
      projects: state.projects.filter(p => p.id !== id),
    })),
  setSelectedProjectId: selectedProjectId => set({ selectedProjectId }),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),
}));
