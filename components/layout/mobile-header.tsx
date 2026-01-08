'use client';

import { Menu, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui-store';

export function MobileHeader() {
  const { toggleSidebar, isMobile } = useUIStore();

  if (!isMobile) return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-background/80 backdrop-blur-sm border-b border-border z-30 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center neon-glow-cyan">
          <Zap className="w-3.5 h-3.5 text-neon-cyan" />
        </div>
        <span className="font-bold">NeonTask</span>
      </div>

      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-9 w-9">
        <Menu className="h-5 w-5" />
      </Button>
    </header>
  );
}
