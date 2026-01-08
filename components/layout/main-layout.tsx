'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { AppSidebar } from './app-sidebar';
import { MobileHeader } from './mobile-header';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarOpen, isMobile, setIsMobile, setSidebarOpen } = useUIStore();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile, setSidebarOpen]);

  return (
    <div className="min-h-screen bg-gradient-dark">
      <AppSidebar />
      <MobileHeader />

      <main
        className={cn(
          'min-h-screen transition-all duration-300 ease-in-out',
          isMobile ? 'pt-14' : sidebarOpen ? 'pl-64' : 'pl-16'
        )}
      >
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
