import React from 'react';
import { cn } from '../../lib/utils';
import { JobStatus, RemoteType, Seniority, JobAvailability } from '../../../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'status' | 'match' | 'remote' | 'seniority' | 'availability';
  status?: JobStatus;
  availability?: JobAvailability;
  remoteType?: RemoteType;
  seniority?: Seniority;
  score?: number;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  status,
  availability,
  remoteType,
  seniority,
  score,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full select-none';

  if (variant === 'status' && status) {
    const statusStyles: Record<JobStatus, string> = {
      NEW: 'bg-accent/15 text-accent border border-accent/25',
      SAVED: 'bg-purple-500/15 text-purple-400 border border-purple-500/25',
      SELECTED: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25',
      APPLIED: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
      INTERVIEW: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
      OFFER: 'bg-success/15 text-success border border-success/25',
      REJECTED: 'bg-danger/15 text-danger border border-danger/25',
      IGNORED: 'bg-surface-elevated text-text-muted border border-border',
    };
    return (
      <span className={cn(baseStyles, statusStyles[status], className)} {...props}>
        {status}
      </span>
    );
  }

  if (variant === 'availability' && availability) {
    const availStyles: Record<JobAvailability, string> = {
      ACTIVE: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
      UNVERIFIED: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
      EXPIRED: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
      REMOVED: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
      INVALID: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    };
    const availLabels: Record<JobAvailability, string> = {
      ACTIVE: '● Verified',
      UNVERIFIED: '○ Unverified',
      EXPIRED: '● Closed',
      REMOVED: '● Removed',
      INVALID: '⚠ Invalid',
    };
    return (
      <span className={cn(baseStyles, availStyles[availability], className)} {...props}>
        {availLabels[availability] || availability}
      </span>
    );
  }

  if (variant === 'match' && score !== undefined) {
    let scoreStyle = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    if (score < 50) scoreStyle = 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
    else if (score < 75) scoreStyle = 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
    else if (score < 90) scoreStyle = 'bg-blue-500/15 text-blue-400 border border-blue-500/30';

    return (
      <span className={cn(baseStyles, scoreStyle, className)} {...props}>
        {score}% Match
      </span>
    );
  }

  if (variant === 'remote' && remoteType) {
    const remoteLabels: Record<RemoteType, string> = {
      remote: '● Remote',
      hybrid: '● Hybrid',
      onsite: '● On-site',
      unknown: '● Location TBD',
    };
    const remoteStyles: Record<RemoteType, string> = {
      remote: 'bg-emerald-500/10 text-emerald-400',
      hybrid: 'bg-amber-500/10 text-amber-400',
      onsite: 'bg-slate-500/10 text-slate-400',
      unknown: 'bg-surface-elevated text-text-muted',
    };
    return (
      <span className={cn(baseStyles, remoteStyles[remoteType], className)} {...props}>
        {remoteLabels[remoteType]}
      </span>
    );
  }

  return (
    <span
      className={cn(baseStyles, 'bg-surface-elevated text-text-secondary border border-border', className)}
      {...props}
    >
      {children}
    </span>
  );
};
