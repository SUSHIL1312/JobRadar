import React from 'react';
import { NormalizedJob, JobStatus } from '../../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { JobCard } from '../components/JobCard';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Sparkles,
  CheckCircle2,
  Send,
  Bookmark,
  Calendar,
  Award,
  Globe,
  ArrowRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface DashboardViewProps {
  jobs: NormalizedJob[];
  loading: boolean;
  statusCounts: Record<string, number>;
  onSelectJob: (job: NormalizedJob) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => Promise<void>;
  onDeleteJob?: (jobId: string) => Promise<void>;
  onNavigate: (route: string) => void;
  lastRunInfo?: { finishedAt: string; jobsNew: number; matchingJobs: number };
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  jobs,
  loading,
  statusCounts,
  onSelectJob,
  onStatusChange,
  onDeleteJob,
  onNavigate,
  lastRunInfo,
}) => {
  // Determine greeting by current hour
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17) greeting = 'Good evening';

  // Slices for dashboard sections
  const freshJobs = jobs.filter((j) => {
    if (!j.datePosted && !j.discoveredAt) return false;
    const date = new Date(j.datePosted || j.discoveredAt).getTime();
    return Date.now() - date <= 24 * 3600 * 1000;
  });

  const topMatches = [...jobs]
    .filter((j) => (j.matchScore?.overallScore || 0) >= 75)
    .sort((a, b) => (b.matchScore?.overallScore || 0) - (a.matchScore?.overallScore || 0))
    .slice(0, 6);

  const remoteJobs = jobs.filter((j) => j.remoteType === 'remote').slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
            {greeting}, Sushil
          </h2>
          <p className="text-sm text-text-secondary mt-1 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-accent font-medium">
              <ShieldCheck className="w-4 h-4" /> Your JobRadar is active.
            </span>
            {lastRunInfo ? (
              <span className="text-text-muted">
                Last scan: {new Date(lastRunInfo.finishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                {lastRunInfo.jobsNew} new jobs • {lastRunInfo.matchingJobs} matches
              </span>
            ) : (
              <span className="text-text-muted">Autonomous scheduled scans running.</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onNavigate('jobs')}>
            <span>Browse All ({statusCounts.TOTAL || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card
          onClick={() => onNavigate('fresh')}
          hoverable
          className="p-4 bg-surface border-border flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold">Fresh (&lt;24h)</span>
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div className="text-2xl font-black text-text-main mt-2">
            {statusCounts.FRESH || 0}
          </div>
          <span className="text-[10px] text-accent font-medium mt-1">High freshness</span>
        </Card>

        <Card
          onClick={() => onNavigate('selected')}
          hoverable
          className="p-4 bg-surface border-border flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold">Selected</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-text-main mt-2">
            {statusCounts.SELECTED || 0}
          </div>
          <span className="text-[10px] text-text-muted mt-1">Ready to review</span>
        </Card>

        <Card
          onClick={() => onNavigate('applied')}
          hoverable
          className="p-4 bg-surface border-border flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold">Applied</span>
            <Send className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-text-main mt-2">
            {statusCounts.APPLIED || 0}
          </div>
          <span className="text-[10px] text-text-muted mt-1">In progress</span>
        </Card>

        <Card
          onClick={() => onNavigate('saved')}
          hoverable
          className="p-4 bg-surface border-border flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold">Saved</span>
            <Bookmark className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-text-main mt-2">
            {statusCounts.SAVED || 0}
          </div>
          <span className="text-[10px] text-text-muted mt-1">Bookmarked</span>
        </Card>

        <Card
          onClick={() => onNavigate('interviews')}
          hoverable
          className="p-4 bg-surface border-border flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold">Interviews</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-text-main mt-2">
            {statusCounts.INTERVIEW || 0}
          </div>
          <span className="text-[10px] text-amber-400 font-medium mt-1">Active rounds</span>
        </Card>

        <Card
          onClick={() => onNavigate('offers')}
          hoverable
          className="p-4 bg-surface border-border flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold">Offers</span>
            <Award className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl font-black text-text-main mt-2">
            {statusCounts.OFFER || 0}
          </div>
          <span className="text-[10px] text-success font-medium mt-1">Success</span>
        </Card>
      </div>

      {/* Top Profile Compatibility Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-bold text-text-main">Top Profile Matches</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('jobs')}>
            View all
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        ) : topMatches.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-xl text-text-muted text-sm">
            No high-match jobs found yet. Run a search or adjust profile skills.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topMatches.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSelectJob={onSelectJob}
                onStatusChange={onStatusChange}
                onDeleteJob={onDeleteJob}
              />
            ))}
          </div>
        )}
      </section>

      {/* Fresh Opportunities Feed */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-bold text-text-main">Fresh Opportunities (&lt;24h)</h3>
          </div>
          <span className="text-xs text-text-muted font-medium">{freshJobs.length} fresh jobs</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        ) : freshJobs.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-xl text-text-muted text-sm">
            No fresh jobs discovered in the last 24 hours. The next scheduled scan will discover newly published postings.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {freshJobs.slice(0, 4).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSelectJob={onSelectJob}
                onStatusChange={onStatusChange}
                onDeleteJob={onDeleteJob}
              />
            ))}
          </div>
        )}
      </section>

      {/* Remote Opportunities Section */}
      {remoteJobs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-text-main">Remote Opportunities</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('jobs')}>
              View all remote
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {remoteJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSelectJob={onSelectJob}
                onStatusChange={onStatusChange}
                onDeleteJob={onDeleteJob}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
