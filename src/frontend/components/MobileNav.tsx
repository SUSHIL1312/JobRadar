import React, { useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  CheckCircle2,
  Send,
  MoreHorizontal,
  Bookmark,
  BarChart3,
  User,
  Settings,
  X,
  History,
  Radio,
} from 'lucide-react';

interface MobileNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  statusCounts: Record<string, number>;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentRoute,
  onNavigate,
  statusCounts,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, count: statusCounts.TOTAL },
    { id: 'selected', label: 'Selected', icon: CheckCircle2, count: statusCounts.SELECTED },
    { id: 'applied', label: 'Applied', icon: Send, count: statusCounts.APPLIED },
  ];

  const moreItems = [
    { id: 'saved', label: 'Saved Jobs', icon: Bookmark, count: statusCounts.SAVED },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'search-runs', label: 'Search Runs', icon: History },
    { id: 'sources', label: 'Job Sources', icon: Radio },
    { id: 'profile', label: 'Career Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Bottom Floating Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border px-2 py-1.5 flex items-center justify-around safe-bottom">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-accent font-semibold' : 'text-text-muted hover:text-text-main'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5 mb-0.5" />
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1 -right-2 bg-accent text-white text-[9px] font-bold px-1 rounded-full">
                    {item.count}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setShowMoreMenu(true)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            showMoreMenu ? 'text-accent font-semibold' : 'text-text-muted hover:text-text-main'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </div>

      {/* More Bottom Sheet Drawer */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="relative bg-surface border-t border-border rounded-t-2xl p-5 z-10 animate-slide-up space-y-3 pb-8">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold text-sm text-text-main">Navigation</span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-md text-text-muted hover:text-text-main"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-elevated/70 border border-border text-xs font-medium text-text-main hover:bg-surface-elevated"
                  >
                    <Icon className="w-4 h-4 text-accent" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
