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
import { NormalizedJob } from '../../types';
import { api } from '../lib/api';
import { Badge } from './ui/Badge';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  onRunSearch: () => void;
  onToggleTheme: () => void;
  onSelectJob?: (job: NormalizedJob) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onRunSearch,
  onToggleTheme,
  onSelectJob,
}) => {
  const [query, setQuery] = useState('');
  const [jobResults, setJobResults] = useState<NormalizedJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setJobResults([]);
    }
  }, [isOpen]);

  // Debounced search for jobs by Job ID (JR-2026-000184), Source ID, or keyword
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setJobResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingJobs(true);
        const res = await api.getJobs({ searchQuery: query.trim(), pageSize: 5 });
        setJobResults(res.jobs);
      } catch (err) {
        console.error('Command palette job search failed:', err);
      } finally {
        setLoadingJobs(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

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

  const filteredCommands = commands.filter((c) =>
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
      <div className="relative w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-10 animate-slide-up">
        {/* Input */}
        <div className="flex items-center px-4 py-3 border-b border-border gap-3">
          <Search className="w-5 h-5 text-text-muted" />
          <input
            type="text"
            autoFocus
            placeholder="Search by Job ID (e.g. JR-2026-000184), Source ID, company, or command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-text-main placeholder:text-text-muted focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-surface-elevated border border-border rounded">
            ESC
          </kbd>
        </div>

        {/* Content List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Job Search Matches */}
          {query.trim().length >= 2 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center justify-between">
                <span>Matching Jobs</span>
                {loadingJobs && <span className="text-[10px] lowercase opacity-70">Searching...</span>}
              </div>
              {jobResults.length === 0 && !loadingJobs ? (
                <div className="px-3 py-2 text-xs text-text-muted italic">
                  No jobs found matching "{query}"
                </div>
              ) : (
                jobResults.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => {
                      if (onSelectJob) {
                        onSelectJob(job);
                      }
                      onClose();
                    }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm text-text-main hover:bg-surface-elevated text-left transition-colors group"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface border border-border text-accent group-hover:border-accent">
                        {job.jobId || job.id.slice(0, 10)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs truncate group-hover:text-accent">
                          {job.title}
                        </div>
                        <div className="text-[11px] text-text-muted truncate">
                          {job.company} {job.sourceJobId ? `• Src #${job.sourceJobId}` : ''}
                        </div>
                      </div>
                    </div>
                    <Badge variant="status" status={job.status} />
                  </button>
                ))
              )}
            </div>
          )}

          {/* Navigation & Commands */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Commands & Navigation
            </div>
            {filteredCommands.length === 0 ? (
              <div className="px-3 py-2 text-xs text-text-muted italic">
                No matching navigation commands
              </div>
            ) : (
              filteredCommands.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      c.action();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-main hover:bg-surface-elevated hover:text-accent text-left transition-colors"
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
    </div>
  );
};
