import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Bookmark,
  CheckCircle2,
  Send,
  XCircle,
  Calendar,
  Award,
  BarChart3,
  Radio,
  History,
  User,
  Settings,
  Sparkles,
  Sun,
  Moon,
  RotateCw,
} from 'lucide-react';
import { Button } from './ui/Button';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  statusCounts: Record<string, number>;
  theme: string;
  onToggleTheme: () => void;
  onRunSearch: () => void;
  isSearching: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  statusCounts,
  theme,
  onToggleTheme,
  onRunSearch,
  isSearching,
}) => {
  const navSections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'JOBS',
      items: [
        { id: 'jobs', label: 'All Jobs', icon: Briefcase, count: statusCounts.TOTAL },
        { id: 'fresh', label: 'Fresh (<24h)', icon: Sparkles, count: statusCounts.FRESH },
        { id: 'selected', label: 'Selected', icon: CheckCircle2, count: statusCounts.SELECTED },
        { id: 'applied', label: 'Applied', icon: Send, count: statusCounts.APPLIED },
        { id: 'saved', label: 'Saved', icon: Bookmark, count: statusCounts.SAVED },
        { id: 'interviews', label: 'Interviews', icon: Calendar, count: statusCounts.INTERVIEW },
        { id: 'offers', label: 'Offers', icon: Award, count: statusCounts.OFFER },
        { id: 'rejected', label: 'Rejected', icon: XCircle, count: statusCounts.REJECTED },
      ],
    },
    {
      title: 'INSIGHTS',
      items: [
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'search-runs', label: 'Search Runs', icon: History },
        { id: 'sources', label: 'Sources', icon: Radio },
      ],
    },
    {
      title: 'CONFIGURATION',
      items: [
        { id: 'profile', label: 'Career Profile', icon: User },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border h-screen flex flex-col shrink-0 select-none overflow-y-auto">
      {/* Brand Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white shadow-sm shadow-accent/30 font-bold">
            <Radio className="w-4 h-4 animate-pulse-subtle" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-text-main">JobRadar</h1>
            <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider">Automated Assistant</p>
          </div>
        </div>

        <button
          onClick={onToggleTheme}
          title="Toggle light / dark mode"
          className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-elevated transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Manual Search CTA */}
      <div className="px-4 py-3">
        <Button
          variant="accent"
          size="sm"
          className="w-full justify-center shadow-xs"
          loading={isSearching}
          onClick={onRunSearch}
        >
          {!isSearching && <RotateCw className="w-3.5 h-3.5" />}
          <span>{isSearching ? 'Scanning sources...' : 'Run Search Now'}</span>
        </Button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-2 space-y-5">
        {navSections.map((sec) => (
          <div key={sec.title}>
            <div className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-text-muted font-mono uppercase">
              {sec.title}
            </div>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-accent/15 text-accent font-semibold'
                        : 'text-text-secondary hover:text-text-main hover:bg-surface-elevated/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-text-muted'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                          isActive
                            ? 'bg-accent/20 text-accent font-bold'
                            : 'bg-surface-elevated text-text-muted'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer User Info */}
      <div className="p-3.5 border-t border-border mt-auto bg-surface-elevated/20">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-accent/20 text-accent font-semibold text-xs flex items-center justify-center">
            S
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-text-main truncate">Sushil</div>
            <div className="text-[10px] text-text-muted truncate">Personal Workspace</div>
          </div>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-mono text-text-muted bg-surface-elevated border border-border rounded">
            ⌘K
          </kbd>
        </div>
      </div>
    </aside>
  );
};
