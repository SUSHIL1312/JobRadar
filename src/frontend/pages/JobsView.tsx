import React from 'react';
import { NormalizedJob, JobStatus, FilterState } from '../../types';
import { FilterBar } from '../components/FilterBar';
import { JobCard } from '../components/JobCard';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

interface JobsViewProps {
  jobs: NormalizedJob[];
  total: number;
  loading: boolean;
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  onResetFilter: () => void;
  onSelectJob: (job: NormalizedJob) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => Promise<void>;
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
  title = 'Job Feed',
  subtitle = 'Search and filter across newly discovered opportunities.',
}) => {
  const currentPage = filter.page || 1;
  const pageSize = filter.pageSize || 25;
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-text-main tracking-tight">{title}</h2>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">{subtitle}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onSelectJob={onSelectJob}
              onStatusChange={onStatusChange}
            />
          ))}
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
