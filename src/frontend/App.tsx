import React, { useState, useEffect, useCallback } from 'react';
import { NormalizedJob, JobStatus, FilterState } from '../types';
import { api } from './lib/api';
import { getInitialTheme, applyTheme, Theme } from './lib/theme';
import { useToast } from './components/ui/Toast';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { JobDetailDrawer } from './components/JobDetailDrawer';
import { CommandPalette } from './components/CommandPalette';
import { DashboardView } from './pages/DashboardView';
import { JobsView } from './pages/JobsView';
import { ApplicationTrackerView } from './pages/ApplicationTrackerView';
import { ProfileView } from './pages/ProfileView';
import { AnalyticsView } from './pages/AnalyticsView';
import { SearchRunsView } from './pages/SearchRunsView';
import { SourcesView } from './pages/SourcesView';
import { SettingsView } from './pages/SettingsView';
import { Radio, Moon, Sun } from 'lucide-react';
import { Button } from './components/ui/Button';

export const App: React.FC = () => {
  const { toast } = useToast();
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [theme, setTheme] = useState<Theme>(getInitialTheme());
  const [jobs, setJobs] = useState<NormalizedJob[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedJob, setSelectedJob] = useState<NormalizedJob | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [lastRunInfo, setLastRunInfo] = useState<{ finishedAt: string; jobsNew: number; matchingJobs: number } | undefined>();

  // Filter state for jobs view
  const [filter, setFilter] = useState<FilterState>({
    status: 'ALL',
    ageHorizon: 'all',
    page: 1,
    pageSize: 25,
    sort: 'fresh_match',
  });

  // Apply theme on load and change
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  // Load jobs based on current route and filter
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const activeFilter: FilterState = { ...filter };

      // Map special routes to filter states
      if (currentRoute === 'fresh') {
        activeFilter.ageHorizon = '24h';
        activeFilter.status = 'ALL';
      } else if (['selected', 'applied', 'saved', 'rejected'].includes(currentRoute)) {
        activeFilter.status = currentRoute.toUpperCase() as JobStatus;
        activeFilter.ageHorizon = 'all';
      } else if (currentRoute === 'interviews') {
        activeFilter.status = 'INTERVIEW';
      } else if (currentRoute === 'offers') {
        activeFilter.status = 'OFFER';
      }

      const res = await api.getJobs(activeFilter);
      setJobs(res.jobs);
      setTotalJobs(res.total);
    } catch {
      toast('Failed to load jobs from server', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, currentRoute, toast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Load latest search run summary
  useEffect(() => {
    api.getSearchRuns().then((runs) => {
      if (runs && runs.length > 0) {
        const latest = runs[0];
        if (latest.status === 'RUNNING') {
          setIsSearching(true);
        }
        if (latest.finishedAt) {
          setLastRunInfo({
            finishedAt: latest.finishedAt,
            jobsNew: latest.jobsNew,
            matchingJobs: latest.jobsMatching,
          });
        }
      }
    }).catch(() => {});
  }, []);

  // Global Keyboard Shortcuts (Cmd+K, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K opens Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Status Counts computation
  const statusCounts: Record<string, number> = {
    TOTAL: totalJobs,
    FRESH: jobs.filter((j) => {
      const d = new Date(j.datePosted || j.discoveredAt).getTime();
      return Date.now() - d <= 24 * 3600 * 1000;
    }).length,
    SELECTED: jobs.filter((j) => j.status === 'SELECTED').length,
    APPLIED: jobs.filter((j) => j.status === 'APPLIED').length,
    SAVED: jobs.filter((j) => j.status === 'SAVED').length,
    INTERVIEW: jobs.filter((j) => j.status === 'INTERVIEW').length,
    OFFER: jobs.filter((j) => j.status === 'OFFER').length,
    REJECTED: jobs.filter((j) => j.status === 'REJECTED').length,
  };

  // Status Change Handler with Optimistic UI update
  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    // Optimistic UI update
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );
    if (selectedJob && selectedJob.id === jobId) {
      setSelectedJob({ ...selectedJob, status: newStatus });
    }

    try {
      await api.updateJobStatus(jobId, newStatus);
      toast(`Marked job as ${newStatus}`, 'success');
    } catch {
      toast('Failed to update status on server', 'error');
      fetchJobs(); // rollback
    }
  };

  // Save Notes Handler
  const handleSaveNotes = async (jobId: string, notes: string) => {
    try {
      await api.updateJobNotes(jobId, notes);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, notes } : j))
      );
      if (selectedJob) setSelectedJob({ ...selectedJob, notes });
      toast('Notes saved to D1', 'success');
    } catch {
      toast('Failed to save notes', 'error');
    }
  };

  // Interview Date Handler
  const handleSaveInterview = async (jobId: string, date: string, round?: string) => {
    try {
      await api.updateJobInterview(jobId, date, round);
      toast('Interview recorded', 'success');
      fetchJobs();
    } catch {
      toast('Failed to record interview', 'error');
    }
  };

  // Offer Handler
  const handleSaveOffer = async (jobId: string, salary: number, currency?: string) => {
    try {
      await api.updateJobOffer(jobId, salary, currency);
      toast('Offer recorded', 'success');
      fetchJobs();
    } catch {
      toast('Failed to record offer', 'error');
    }
  };

  // Delete Job Handler
  const handleDeleteJob = async (jobId: string) => {
    try {
      await api.deleteJob(jobId);
      toast('Job permanently deleted', 'success');
      if (selectedJob?.id === jobId) setSelectedJob(null);
      fetchJobs();
    } catch {
      toast('Failed to delete job', 'error');
    }
  };

  // Bulk Delete Jobs Handler
  const handleBulkDeleteJobs = async (jobIds: string[]) => {
    try {
      const res = await api.bulkDeleteJobs(jobIds);
      toast(`${res.deleted} job(s) permanently deleted`, 'success');
      if (selectedJob && jobIds.includes(selectedJob.id)) setSelectedJob(null);
      fetchJobs();
    } catch {
      toast('Failed to delete selected jobs', 'error');
    }
  };

  // Run Search Now Action
  const handleRunSearch = async () => {
    if (isSearching) return;
    try {
      setIsSearching(true);
      toast('Starting 10–12 minute deep scan across 30 target companies...', 'info');
      const result = await api.runSearchNow();

      if (result.status === 'RUNNING') {
        toast('Deep scan running in background (10–12 minutes). You can continue browsing.', 'info');
        // Start polling for completion every 20 seconds
        const pollInterval = setInterval(async () => {
          try {
            const runs = await api.getSearchRuns();
            const latest = runs[0];
            if (latest && (latest.status === 'COMPLETED' || latest.status === 'PARTIAL')) {
              clearInterval(pollInterval);
              setIsSearching(false);
              const newJobs = (latest as any).jobsNew ?? (latest as any).jobs_new ?? 0;
              const matchingJobs = (latest as any).jobsMatching ?? (latest as any).jobs_matching ?? 0;
              toast(
                `Deep scan completed: ${newJobs} new jobs found (${matchingJobs} strong matches)!`,
                'success'
              );
              fetchJobs();
            }
          } catch {
            // Ignore poll error
          }
        }, 20000);
      } else {
        toast(
          `Search completed: ${result.jobsNew} new jobs discovered (${result.jobsMatching} strong matches).`,
          'success'
        );
        fetchJobs();
        setIsSearching(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast(`Search error: ${msg}`, 'error');
      setIsSearching(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-text-main overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={(r) => {
            setCurrentRoute(r);
            setFilter((prev) => ({ ...prev, page: 1 }));
          }}
          statusCounts={statusCounts}
          theme={theme}
          onToggleTheme={toggleTheme}
          onRunSearch={handleRunSearch}
          isSearching={isSearching}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between p-3.5 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-xs">
              <Radio className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm tracking-tight">JobRadar</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="accent"
              loading={isSearching}
              onClick={handleRunSearch}
              className="text-xs py-1 px-2.5"
            >
              Scan
            </Button>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-main"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          {currentRoute === 'dashboard' && (
            <DashboardView
              jobs={jobs}
              loading={loading}
              statusCounts={statusCounts}
              onSelectJob={setSelectedJob}
              onStatusChange={handleStatusChange}
              onDeleteJob={handleDeleteJob}
              onNavigate={(r) => {
                setCurrentRoute(r);
                setFilter((prev) => ({ ...prev, page: 1 }));
              }}
              lastRunInfo={lastRunInfo}
            />
          )}

          {['jobs', 'fresh', 'selected', 'saved', 'rejected'].includes(currentRoute) && (
            <JobsView
              jobs={jobs}
              total={totalJobs}
              loading={loading}
              filter={filter}
              onFilterChange={setFilter}
              onResetFilter={() =>
                setFilter({
                  status: 'ALL',
                  ageHorizon: 'all',
                  page: 1,
                  pageSize: 25,
                  sort: 'fresh_match',
                })
              }
              onSelectJob={setSelectedJob}
              onStatusChange={handleStatusChange}
              onDeleteJob={handleDeleteJob}
              onBulkDeleteJobs={handleBulkDeleteJobs}
              title={
                currentRoute === 'fresh'
                  ? 'Fresh Opportunities (<24h)'
                  : currentRoute === 'selected'
                  ? 'Selected Opportunities'
                  : currentRoute === 'saved'
                  ? 'Saved Jobs'
                  : currentRoute === 'rejected'
                  ? 'Rejected Postings'
                  : 'All Opportunities'
              }
            />
          )}

          {currentRoute === 'applied' && (
            <ApplicationTrackerView
              jobs={jobs}
              onSelectJob={setSelectedJob}
              onStatusChange={handleStatusChange}
            />
          )}

          {currentRoute === 'profile' && <ProfileView />}

          {currentRoute === 'analytics' && <AnalyticsView />}

          {currentRoute === 'search-runs' && <SearchRunsView />}

          {currentRoute === 'sources' && <SourcesView />}

          {currentRoute === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentRoute={currentRoute}
        onNavigate={(r) => {
          setCurrentRoute(r);
          setFilter((prev) => ({ ...prev, page: 1 }));
        }}
        statusCounts={statusCounts}
      />

      {/* Job Detail Slide-out Sheet */}
      <JobDetailDrawer
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onStatusChange={handleStatusChange}
        onDeleteJob={handleDeleteJob}
        onSaveNotes={handleSaveNotes}
        onSaveInterview={handleSaveInterview}
        onSaveOffer={handleSaveOffer}
      />

      {/* Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={(r) => {
          setCurrentRoute(r);
          setFilter((prev) => ({ ...prev, page: 1 }));
        }}
        onRunSearch={handleRunSearch}
        onToggleTheme={toggleTheme}
        onSelectJob={(job) => setSelectedJob(job)}
      />
    </div>
  );
};
