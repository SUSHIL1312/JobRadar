import React, { useState } from 'react';
import { NormalizedJob, JobStatus } from '../../types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Chip } from './ui/Chip';
import { Card } from './ui/Card';
import { formatSalary } from '../lib/utils';
import { formatRelativeAge } from '../../jobs/normalization/dates';
import {
  ExternalLink,
  Bookmark,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Send,
  XCircle,
} from 'lucide-react';

interface JobCardProps {
  job: NormalizedJob;
  onSelectJob: (job: NormalizedJob) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => Promise<void>;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onSelectJob, onStatusChange }) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const match = job.matchScore;

  // Company avatar initial
  const initial = job.company.charAt(0).toUpperCase();

  return (
    <Card
      hoverable
      onClick={() => onSelectJob(job)}
      className="p-4 sm:p-5 relative group border-border hover:border-accent/40"
    >
      <div className="flex flex-col gap-3">
        {/* Top Header: Company, Age, Match Pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Company Avatar */}
            <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-border flex items-center justify-center font-bold text-accent shrink-0 text-base shadow-xs">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-main text-sm truncate">
                  {job.company}
                </span>
                <span className="text-xs text-text-muted hidden sm:inline">•</span>
                <span className="text-xs text-text-muted hidden sm:inline">{job.source}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                <Clock className="w-3 h-3" />
                <span>{formatRelativeAge(job.datePosted || job.discoveredAt)}</span>
                {job.location.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[180px]">{job.location[0]}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {match && <Badge variant="match" score={match.overallScore} />}
            <Badge variant="status" status={job.status} />
          </div>
        </div>

        {/* Job Title */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-text-main group-hover:text-accent transition-colors leading-snug">
            {job.title}
          </h3>
        </div>

        {/* Tags Row: Remote, Seniority, Salary */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Badge variant="remote" remoteType={job.remoteType} />
          {job.seniority !== 'unknown' && (
            <span className="px-2 py-0.5 rounded-full bg-surface-elevated text-text-secondary border border-border capitalize font-medium">
              {job.seniority}
            </span>
          )}
          {(job.salaryMin || job.salaryMax) && (
            <span className="px-2 py-0.5 rounded-full bg-surface-elevated text-text-secondary border border-border font-medium">
              {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
            </span>
          )}
        </div>

        {/* Matching Skills */}
        {match && match.matchingSkills.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {match.matchingSkills.slice(0, 5).map((s) => (
              <Chip key={s} label={s} active className="text-[11px] py-0.5 px-2" />
            ))}
            {match.matchingSkills.length > 5 && (
              <span className="text-[11px] text-text-muted self-center">
                +{match.matchingSkills.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Action Row */}
        <div
          className="flex items-center justify-between gap-2 pt-2 border-t border-border-subtle mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left: Quick Status CTAs */}
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={job.status === 'SELECTED' ? 'accent' : 'secondary'}
              onClick={() => onStatusChange(job.id, job.status === 'SELECTED' ? 'NEW' : 'SELECTED')}
              title="Select for application"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{job.status === 'SELECTED' ? 'Selected' : 'Select'}</span>
            </Button>
            <Button
              size="sm"
              variant={job.status === 'SAVED' ? 'accent' : 'secondary'}
              onClick={() => onStatusChange(job.id, job.status === 'SAVED' ? 'NEW' : 'SAVED')}
              title="Save job"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{job.status === 'SAVED' ? 'Saved' : 'Save'}</span>
            </Button>

            {/* Desktop only buttons */}
            <div className="hidden md:flex items-center gap-1.5">
              <Button
                size="sm"
                variant={job.status === 'APPLIED' ? 'primary' : 'ghost'}
                onClick={() => onStatusChange(job.id, 'APPLIED')}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Applied</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onStatusChange(job.id, 'REJECTED')}
                className="hover:text-danger"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </Button>
            </div>

            {/* Mobile overflow menu */}
            <div className="relative md:hidden">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>

              {showMobileMenu && (
                <div className="absolute left-0 bottom-full mb-1 w-36 bg-surface border border-border rounded-lg shadow-xl p-1 z-30 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      onStatusChange(job.id, 'APPLIED');
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-text-main hover:bg-surface-hover rounded flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Mark Applied
                  </button>
                  <button
                    onClick={() => {
                      onStatusChange(job.id, 'REJECTED');
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-danger hover:bg-danger/10 rounded flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Primary Apply Button */}
          <a
            href={job.canonicalUrl || job.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center font-medium rounded-lg text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 gap-1.5 bg-accent text-white hover:bg-accent/90 shadow-sm transition-all shrink-0"
          >
            <span>Open Job</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </Card>
  );
};
