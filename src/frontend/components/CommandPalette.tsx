import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Bookmark,
  CheckCircle2,
  Send,
  BarChart3,
  User,
  Settings,
  Search,
  Moon,
  Play,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  onRunSearch: () => void;
  onToggleTheme: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onRunSearch,
  onToggleTheme,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: 'dash', label: 'Go to Dashboard', icon: LayoutDashboard, action: () => onNavigate('dashboard') },
    { id: 'jobs', label: 'Browse All Jobs', icon: Briefcase, action: () => onNavigate('jobs') },
    { id: 'selected', label: 'View Selected Jobs', icon: CheckCircle2, action: () => onNavigate('selected') },
    { id: 'saved', label: 'View Saved Jobs', icon: Bookmark, action: () => onNavigate('saved') },
    { id: 'applied', label: 'Application Tracker', icon: Send, action: () => onNavigate('applied') },
    { id: 'analytics', label: 'View Analytics', icon: BarChart3, action: () => onNavigate('analytics') },
    { id: 'profile', label: 'Edit Career Profile', icon: User, action: () => onNavigate('profile') },
    { id: 'settings', label: 'System Settings', icon: Settings, action: () => onNavigate('settings') },
    { id: 'search_now', label: 'Run Search Scan Now', icon: Play, action: onRunSearch },
    { id: 'theme', label: 'Toggle Light / Dark Mode', icon: Moon, action: onToggleTheme },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-10 animate-slide-up">
        {/* Input */}
        <div className="flex items-center px-4 py-3 border-b border-border gap-3">
          <Search className="w-5 h-5 text-text-muted" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or navigate (e.g. Profile, Search)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-text-main placeholder:text-text-muted focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-surface-elevated border border-border rounded">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-text-muted">
              No matching commands found.
            </div>
          ) : (
            filtered.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    c.action();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-main hover:bg-surface-elevated hover:text-accent text-left transition-colors"
                >
                  <Icon className="w-4 h-4 text-text-muted group-hover:text-accent" />
                  <span>{c.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
