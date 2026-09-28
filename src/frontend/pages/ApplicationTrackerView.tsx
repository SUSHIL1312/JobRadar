import React from 'react';
import { NormalizedJob, JobStatus } from '../../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ExternalLink, CheckCircle2, Send, Calendar, Award } from 'lucide-react';

interface ApplicationTrackerViewProps {
  jobs: NormalizedJob[];
  onSelectJob: (job: NormalizedJob) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => Promise<void>;
}

export const ApplicationTrackerView: React.FC<ApplicationTrackerViewProps> = ({
  jobs,
  onSelectJob,
  onStatusChange,
}) => {
  const columns: Array<{
    id: JobStatus;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }> = [
    { id: 'SELECTED', title: 'Selected to Apply', icon: CheckCircle2, accentColor: 'text-cyan-400' },
    { id: 'APPLIED', title: 'Applied', icon: Send, accentColor: 'text-blue-400' },
    { id: 'INTERVIEW', title: 'Interviewing', icon: Calendar, accentColor: 'text-amber-400' },
    { id: 'OFFER', title: 'Offers Received', icon: Award, accentColor: 'text-success' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-text-main tracking-tight">Application Tracker</h2>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Monitor your human-driven job application pipeline and interview stages.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col.id);
          const Icon = col.icon;

          return (
            <div
              key={col.id}
              className="bg-surface-elevated/40 border border-border rounded-xl p-3.5 space-y-3 min-h-[450px] flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${col.accentColor}`} />
                  <span className="font-bold text-xs uppercase tracking-wider text-text-main">
                    {col.title}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-text-muted px-2 py-0.5 rounded-full bg-surface-elevated border border-border">
                  {colJobs.length}
                </span>
              </div>

              {/* Column Jobs List */}
              <div className="space-y-2.5 flex-1">
                {colJobs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-text-muted border border-dashed border-border rounded-lg">
                    No jobs in this stage.
                  </div>
                ) : (
                  colJobs.map((job) => (
                    <Card
                      key={job.id}
                      hoverable
                      onClick={() => onSelectJob(job)}
                      className="p-3 bg-surface border-border hover:border-accent/40 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-xs text-text-main line-clamp-1">
                          {job.company}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-mono text-[10px] font-semibold text-accent px-1.5 py-0.5 rounded bg-surface-elevated border border-border">
                            {job.jobId || job.id.slice(0, 10)}
                          </span>
                          {job.matchScore && (
                            <Badge variant="match" score={job.matchScore.overallScore} />
                          )}
                        </div>
                      </div>

                      <div className="text-xs font-medium text-text-secondary line-clamp-2">
                        {job.title}
                      </div>

                      {/* Meta badges: Experience, Source ID, Applied Date */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-text-muted">
                        {job.sourceJobId && (
                          <span className="font-mono bg-surface-elevated px-1 rounded border border-border">
                            #{job.sourceJobId}
                          </span>
                        )}
                        {(job.experienceText || job.minExperienceYears !== undefined) && (
                          <span>⏱ {job.experienceText || `${job.minExperienceYears}y exp`}</span>
                        )}
                        {job.appliedAt && (
                          <span className="text-blue-400 font-mono">
                            📅 {new Date(job.appliedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Notes / Interview info if present */}
                      {job.interviewRound && (
                        <div className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          Round: {job.interviewRound}
                        </div>
                      )}
                      {job.notes && (
                        <div className="text-[11px] text-text-muted line-clamp-1 italic">
                          "{job.notes}"
                        </div>
                      )}

                      {/* Workflow advance button */}
                      <div
                        className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a
                          href={job.canonicalUrl || job.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>Apply URL</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        {col.id === 'SELECTED' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-[11px] py-1 px-2 h-auto"
                            onClick={() => onStatusChange(job.id, 'APPLIED')}
                          >
                            Mark Applied &rarr;
                          </Button>
                        )}
                        {col.id === 'APPLIED' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-[11px] py-1 px-2 h-auto text-amber-400"
                            onClick={() => onStatusChange(job.id, 'INTERVIEW')}
                          >
                            Interview &rarr;
                          </Button>
                        )}
                        {col.id === 'INTERVIEW' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-[11px] py-1 px-2 h-auto text-success"
                            onClick={() => onStatusChange(job.id, 'OFFER')}
                          >
                            Offer &rarr;
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
