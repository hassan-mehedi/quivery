'use client';

import { signOut, useSession } from 'next-auth/react';
import { CheckSquare, FileText, LogOut, Settings, ChevronLeft, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/stores/ui-store';

const navigation = [
  {
    name: 'TODOs',
    view: 'todos' as const,
    icon: CheckSquare,
    glowClass: 'neon-glow-cyan',
    activeColor: 'text-neon-cyan',
  },
  {
    name: 'Notes',
    view: 'notes' as const,
    icon: FileText,
    glowClass: 'neon-glow-pink',
    activeColor: 'text-neon-pink',
  },
];

export function AppSidebar() {
  const { data: session } = useSession();
  const { currentView, setCurrentView, sidebarOpen, toggleSidebar, isMobile } = useUIStore();

  const handleNavigation = (view: 'todos' | 'notes') => {
    setCurrentView(view);
    if (isMobile) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={toggleSidebar} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-64' : 'w-16',
          isMobile && !sidebarOpen && '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <div
            className={cn(
              'flex items-center gap-3 transition-opacity duration-200',
              !sidebarOpen && !isMobile && 'opacity-0'
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center neon-glow-cyan">
              <Zap className="w-4 h-4 text-neon-cyan" />
            </div>
            <span className="font-bold text-lg text-foreground">NeonTask</span>
          </div>

          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 hover:bg-sidebar-accent"
            >
              <ChevronLeft
                className={cn(
                  'h-4 w-4 transition-transform duration-300',
                  !sidebarOpen && 'rotate-180'
                )}
              />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navigation.map(item => {
            const isActive = currentView === item.view;
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.view)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  'hover:bg-sidebar-accent group',
                  isActive && 'bg-sidebar-accent',
                  isActive && item.glowClass
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isActive
                      ? item.activeColor
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span
                  className={cn(
                    'font-medium transition-all duration-200',
                    isActive
                      ? item.activeColor
                      : 'text-muted-foreground group-hover:text-foreground',
                    !sidebarOpen && !isMobile && 'opacity-0 w-0'
                  )}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </nav>

        <Separator className="bg-sidebar-border" />

        {/* User section */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                suppressHydrationWarning
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  'hover:bg-sidebar-accent'
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={session?.user?.image || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    'flex-1 text-left transition-all duration-200 overflow-hidden',
                    !sidebarOpen && !isMobile && 'opacity-0 w-0'
                  )}
                >
                  <p className="text-sm font-medium text-foreground truncate">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="cursor-pointer text-foreground">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
