import React, { useState } from 'react';
import { NormalizedJob, JobStatus, FilterState } from '../../types';
import { FilterBar } from '../components/FilterBar';
import { JobCard } from '../components/JobCard';
import { JobListItem } from '../components/JobListItem';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ChevronLeft, ChevronRight, Inbox, CheckSquare, Square, Trash2, LayoutGrid, List } from 'lucide-react';

interface JobsViewProps {
  jobs: NormalizedJob[];
  total: number;
  loading: boolean;
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  onResetFilter: () => void;
  onSelectJob: (job: NormalizedJob) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => Promise<void>;
  onDeleteJob?: (jobId: string) => Promise<void>;
  onBulkDeleteJobs?: (jobIds: string[]) => Promise<void>;
  title?: string;
  subtitle?: string;
}

export const JobsView: React.FC<JobsViewProps> = ({
  jobs,
  total,
  loading,
  filter,
  onFilterChange,
  onResetFilter,
  onSelectJob,
  onStatusChange,
  onDeleteJob,
  onBulkDeleteJobs,
  title = 'Job Feed',
  subtitle = 'Search and filter across newly discovered opportunities.',
}) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'cards' | 'list'>(() => {
    try {
      const saved = localStorage.getItem('jobradar_view_mode');
      return (saved === 'list' || saved === 'cards') ? saved : 'cards';
    } catch {
      return 'cards';
    }
  });

  const handleViewModeChange = (mode: 'cards' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('jobradar_view_mode', mode);
    } catch {
      // ignore
    }
  };

  const currentPage = filter.page || 1;
  const pageSize = filter.pageSize || 25;
  const totalPages = Math.ceil(total / pageSize) || 1;

  const toggleSelectAll = () => {
    if (selectedJobIds.size === jobs.length) {
      setSelectedJobIds(new Set());
    } else {
      setSelectedJobIds(new Set(jobs.map((j) => j.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedJobIds.size === 0 || !onBulkDeleteJobs) return;
    if (window.confirm(`Are you sure you want to permanently delete ${selectedJobIds.size} selected job(s)?`)) {
      await onBulkDeleteJobs(Array.from(selectedJobIds));
      setSelectedJobIds(new Set());
      setIsSelectionMode(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-text-main tracking-tight">{title}</h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* View Mode Toggle: Cards vs List */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-surface-elevated border border-border">
            <button
              type="button"
              onClick={() => handleViewModeChange('cards')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-surface text-accent shadow-xs'
                  : 'text-text-muted hover:text-text-main'
              }`}
              title="Cards view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-surface text-accent shadow-xs'
                  : 'text-text-muted hover:text-text-main'
              }`}
              title="Compact list view"
            >
              <List className="w-3.5 h-3.5" />
              <span>Compact List</span>
            </button>
          </div>

          {/* Bulk Selection Toggle */}
          {jobs.length > 0 && onBulkDeleteJobs && (
            <Button
              size="sm"
              variant={isSelectionMode ? 'accent' : 'outline'}
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedJobIds(new Set());
              }}
              className="shrink-0"
            >
              {isSelectionMode ? (
                <>
                  <Square className="w-3.5 h-3.5 mr-1.5" />
                  Done Selecting
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                  Select to Delete
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filter={filter}
        onFilterChange={onFilterChange}
        onReset={onResetFilter}
        totalCount={total}
      />

      {/* Jobs Grid / List */}
      {loading ? (
        viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-surface-elevated/20 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-text-main">No jobs match your active filters</h3>
          <p className="text-xs text-text-muted max-w-sm">
            Try adjusting your search terms, resetting filters, or widening the job age horizon.
          </p>
          <Button variant="outline" size="sm" onClick={onResetFilter}>
            Reset Filters
          </Button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onSelectJob={onSelectJob}
              onStatusChange={onStatusChange}
              onDeleteJob={onDeleteJob}
              isSelectionMode={isSelectionMode}
              isSelected={selectedJobIds.has(job.id)}
              onToggleSelect={(id) => {
                const next = new Set(selectedJobIds);
                if (next.has(id)) {
                  next.delete(id);
                } else {
                  next.add(id);
                }
                setSelectedJobIds(next);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <JobListItem
              key={job.id}
              job={job}
              onSelectJob={onSelectJob}
              onStatusChange={onStatusChange}
              onDeleteJob={onDeleteJob}
              isSelectionMode={isSelectionMode}
              isSelected={selectedJobIds.has(job.id)}
              onToggleSelect={(id) => {
                const next = new Set(selectedJobIds);
                if (next.has(id)) {
                  next.delete(id);
                } else {
                  next.add(id);
                }
                setSelectedJobIds(next);
              }}
            />
          ))}
        </div>
      )}

      {/* Floating Selection Action Bar */}
      {isSelectionMode && jobs.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface-elevated/95 backdrop-blur-md border border-border px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-up">
          <span className="text-xs font-semibold text-text-main">
            {selectedJobIds.size} of {jobs.length} selected
          </span>
          <div className="h-4 w-px bg-border" />
          <Button size="sm" variant="ghost" onClick={toggleSelectAll} className="text-xs">
            {selectedJobIds.size === jobs.length ? 'Deselect All' : 'Select All on Page'}
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={selectedJobIds.size === 0}
            onClick={handleBulkDelete}
            className="text-xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete Selected ({selectedJobIds.size})
          </Button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-xs text-text-muted">
            Showing <span className="font-semibold text-text-main">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-text-main">{Math.min(currentPage * pageSize, total)}</span> of{' '}
            <span className="font-semibold text-text-main">{total}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage <= 1 || loading}
              onClick={() => onFilterChange({ ...filter, page: currentPage - 1 })}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-xs font-mono text-text-muted px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages || loading}
              onClick={() => onFilterChange({ ...filter, page: currentPage + 1 })}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
