import React from 'react';
import { NormalizedJob, JobStatus } from '../../types';
import { Badge } from './ui/Badge';
import { formatSalary } from '../lib/utils';
import { formatRelativeAge } from '../../jobs/normalization/dates';
import {
  ExternalLink,
  Bookmark,
  CheckCircle2,
  Clock,
  Trash2,
} from 'lucide-react';

interface JobListItemProps {
  job: NormalizedJob;
  onSelectJob: (job: NormalizedJob) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => Promise<void>;
  onDeleteJob?: (jobId: string) => Promise<void>;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (jobId: string) => void;
}

export const JobListItem: React.FC<JobListItemProps> = ({
  job,
  onSelectJob,
  onStatusChange,
  onDeleteJob,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const match = job.matchScore;
  const initial = job.company.charAt(0).toUpperCase();

  return (
    <div
      onClick={() => {
        if (isSelectionMode) {
          onToggleSelect?.(job.id);
        } else {
          onSelectJob(job);
        }
      }}
      className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 sm:px-4 py-3 bg-surface hover:bg-surface-elevated/70 border border-border rounded-xl transition-all cursor-pointer shadow-2xs hover:border-accent/40 ${
        isSelected ? 'ring-2 ring-accent border-accent/60 bg-accent/5' : ''
      }`}
    >
      {/* Left section: Checkbox + Avatar + Match + Job details */}
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect?.(job.id);
            }}
            className="w-4 h-4 rounded border-border text-accent focus:ring-accent cursor-pointer shrink-0 mt-1 sm:mt-0"
          />
        )}

        {/* Company Avatar */}
        <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center font-bold text-accent shrink-0 text-xs shadow-xs hidden sm:flex">
          {initial}
        </div>

        {/* Match Score Badge */}
        <div className="shrink-0">
          {match ? (
            <Badge variant="match" score={match.overallScore} />
          ) : (
            <span className="text-[11px] font-mono text-text-muted px-2 py-0.5 rounded bg-surface-elevated border border-border">
              --
            </span>
          )}
        </div>

        {/* Title, IDs, and Company */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-text-main group-hover:text-accent transition-colors truncate">
              {job.title}
            </h4>
            <span className="font-mono text-[10px] font-medium px-1.5 py-0.2 rounded bg-surface-elevated text-accent border border-border shrink-0">
              {job.jobId || job.id.slice(0, 10)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap mt-0.5">
            <span className="font-semibold text-text-secondary truncate max-w-[150px]">{job.company}</span>
            <span>•</span>
            <span className="capitalize">{job.remoteType}</span>

            {job.location.length > 0 && (
              <>
                <span>•</span>
                <span className="truncate max-w-[140px] hidden md:inline">{job.location[0]}</span>
              </>
            )}

            {job.seniority !== 'unknown' && (
              <>
                <span className="hidden lg:inline">•</span>
                <span className="capitalize hidden lg:inline">{job.seniority}</span>
              </>
            )}

            {(job.experienceText || job.minExperienceYears !== undefined) && (
              <>
                <span className="hidden xl:inline">•</span>
                <span className="hidden xl:inline">
                  ⏱ {job.experienceText || `${job.minExperienceYears}${job.maxExperienceYears ? `–${job.maxExperienceYears}` : '+'} yrs`}
                </span>
              </>
            )}

            {(job.salaryMin || job.salaryMax) && (
              <>
                <span>•</span>
                <span className="text-success font-medium">
                  {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                  {job.salaryPeriod && job.salaryPeriod !== 'unknown' && job.salaryPeriod !== 'year' ? `/${job.salaryPeriod === 'hour' ? 'hr' : 'mo'}` : ''}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right section: Age + Status + Actions */}
      <div
        className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Relative Age */}
        <div className="flex items-center gap-1 text-[11px] text-text-muted">
          <Clock className="w-3 h-3 text-text-muted" />
          <span>{formatRelativeAge(job.datePosted || job.discoveredAt)}</span>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          <Badge variant="status" status={job.status} />
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onStatusChange(job.id, job.status === 'SELECTED' ? 'NEW' : 'SELECTED')}
            className={`p-1.5 rounded-lg border transition-colors ${
              job.status === 'SELECTED'
                ? 'bg-accent/15 text-accent border-accent/30'
                : 'text-text-muted hover:text-text-main hover:bg-surface-elevated border-border'
            }`}
            title={job.status === 'SELECTED' ? 'Selected to apply' : 'Select for application'}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onStatusChange(job.id, job.status === 'SAVED' ? 'NEW' : 'SAVED')}
            className={`p-1.5 rounded-lg border transition-colors ${
              job.status === 'SAVED'
                ? 'bg-accent/15 text-accent border-accent/30'
                : 'text-text-muted hover:text-text-main hover:bg-surface-elevated border-border'
            }`}
            title={job.status === 'SAVED' ? 'Saved' : 'Save job'}
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>

          {(job.applicationUrl || job.sourceUrl) && (
            <a
              href={job.applicationUrl || job.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg border border-border text-text-muted hover:text-accent hover:bg-surface-elevated transition-colors flex items-center justify-center"
              title="Apply on original site"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {onDeleteJob && (
            <button
              type="button"
              onClick={async () => {
                if (window.confirm(`Delete job "${job.title}" (${job.jobId || job.id.slice(0, 10)})?`)) {
                  await onDeleteJob(job.id);
                }
              }}
              className="p-1.5 rounded-lg border border-border text-text-muted hover:text-danger hover:border-danger/30 hover:bg-danger/10 transition-colors flex items-center justify-center"
              title="Delete job permanently"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
