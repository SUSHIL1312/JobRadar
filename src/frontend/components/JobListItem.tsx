import React, { useState } from 'react';
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
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api';

interface JobListItemProps {
  job: NormalizedJob;
  onSelectJob: (job: NormalizedJob) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => Promise<void>;
  onDeleteJob?: (jobId: string) => Promise<void>;
  onVerifyJob?: (jobId: string) => Promise<void>;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (jobId: string) => void;
}

export const JobListItem: React.FC<JobListItemProps> = ({
  job,
  onSelectJob,
  onStatusChange,
  onDeleteJob,
  onVerifyJob,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [localAvail, setLocalAvail] = useState(job.availabilityStatus);
  const match = job.matchScore;
  const initial = job.company.charAt(0).toUpperCase();

  const handleRecheck = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVerifying) return;
    setIsVerifying(true);
    try {
      if (onVerifyJob) {
        await onVerifyJob(job.id);
      } else {
        const res = await api.verifyJob(job.id);
        setLocalAvail(res.availabilityStatus);
      }
    } catch (err) {
      console.error('Failed to verify requisition:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const getListItemStatusClasses = (status: JobStatus) => {
    switch (status) {
      case 'APPLIED':
        return 'bg-blue-500/[0.04] border-blue-500/35 hover:bg-blue-500/[0.07] border-l-4 border-l-blue-500';
      case 'REJECTED':
        return 'bg-rose-500/[0.03] border-rose-500/25 hover:bg-rose-500/[0.05] opacity-80 border-l-4 border-l-rose-500/60';
      case 'SELECTED':
        return 'bg-purple-500/[0.04] border-purple-500/35 hover:bg-purple-500/[0.07] border-l-4 border-l-purple-500';
      case 'INTERVIEW':
        return 'bg-amber-500/[0.04] border-amber-500/35 hover:bg-amber-500/[0.07] border-l-4 border-l-amber-500';
      case 'OFFER':
        return 'bg-emerald-500/[0.06] border-emerald-500/40 hover:bg-emerald-500/[0.09] ring-1 ring-emerald-500/20 border-l-4 border-l-emerald-500';
      case 'SAVED':
        return 'bg-cyan-500/[0.03] border-cyan-500/30 hover:bg-cyan-500/[0.06] border-l-4 border-l-cyan-500';
      case 'NEW':
      default:
        return 'bg-surface hover:bg-surface-elevated/70 border-border hover:border-accent/40 border-l-4 border-l-border';
    }
  };

  return (
    <div
      onClick={() => {
        if (isSelectionMode) {
          onToggleSelect?.(job.id);
        } else {
          onSelectJob(job);
        }
      }}
      className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 sm:px-4 py-3 rounded-xl transition-all cursor-pointer shadow-2xs ${getListItemStatusClasses(
        job.status
      )} ${isSelected ? 'ring-2 ring-accent border-accent/60 bg-accent/5' : ''}`}
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

            {job.sourceJobId && (
              <span className="text-[11px] text-text-muted font-mono hidden md:inline" title="Source Job ID">
                #{job.sourceJobId}
              </span>
            )}

            {job.seniority !== 'unknown' && (
              <>
                <span className="hidden lg:inline">•</span>
                <span className="capitalize hidden lg:inline">{job.seniority}</span>
              </>
            )}

            {/* Experience Compatibility */}
            {job.experienceCompatibility && job.experienceCompatibility.status !== 'unspecified' ? (
              <>
                <span className="hidden md:inline">•</span>
                <span
                  className={`hidden md:inline text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                    job.experienceCompatibility.status === 'compatible'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                  title={`Your experience: 4.5 yrs. Required: ${job.experienceCompatibility.requiredText}`}
                >
                  {job.experienceCompatibility.label}
                </span>
              </>
            ) : (
              (job.experienceText || job.minExperienceYears !== undefined) && (
                <>
                  <span className="hidden xl:inline">•</span>
                  <span className="hidden xl:inline">
                    ⏱ {job.experienceText || `${job.minExperienceYears}${job.maxExperienceYears ? `–${job.maxExperienceYears}` : '+'} yrs`}
                  </span>
                </>
              )
            )}

            {/* Salary or Protected Undisclosed Pill */}
            {(job.salaryMin || job.salaryMax) ? (
              <>
                <span>•</span>
                <span className="text-success font-medium">
                  💰 {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                  {job.salaryPeriod && job.salaryPeriod !== 'unknown' && job.salaryPeriod !== 'year' ? `/${job.salaryPeriod === 'hour' ? 'hr' : 'mo'}` : ''}
                </span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="text-text-muted text-[11px] hidden sm:inline" title="High-value opportunity with undisclosed compensation">
                  💰 Undisclosed
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

        {/* Status & Availability Badges */}
        <div className="shrink-0 flex items-center gap-1.5">
          <Badge variant="status" status={job.status} />
          <Badge variant="availability" availability={localAvail || job.availabilityStatus || 'ACTIVE'} />
          <button
            type="button"
            onClick={handleRecheck}
            disabled={isVerifying}
            className="p-1 rounded hover:bg-surface-elevated text-text-muted hover:text-accent transition-colors disabled:opacity-50"
            title="Recheck live requisition availability"
          >
            <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin text-accent' : ''}`} />
          </button>
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
