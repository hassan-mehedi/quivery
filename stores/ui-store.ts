import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type View = 'todos' | 'notes' | 'json-editor';

interface UIState {
  currentView: View;
  sidebarOpen: boolean;
  isMobile: boolean;
  setCurrentView: (view: View) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    set => ({
      currentView: 'todos',
      sidebarOpen: true,
      isMobile: false,
      setCurrentView: currentView => set({ currentView }),
      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: sidebarOpen => set({ sidebarOpen }),
      setIsMobile: isMobile => set({ isMobile }),
    }),
    {
      name: 'ui-storage',
      partialize: state => ({ currentView: state.currentView }),
    }
  )
);
