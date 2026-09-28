import React, { useState, useEffect } from 'react';
import { NormalizedJob, JobStatus } from '../../types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Chip } from './ui/Chip';
import { formatSalary } from '../lib/utils';
import { formatRelativeAge } from '../../jobs/normalization/dates';
import {
  X,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  Calendar,
  DollarSign,
  MapPin,
  Building2,
  Sparkles,
  Clock,
  Send,
  XCircle,
  History,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../lib/api';
import { ApplicationStatusHistory } from '../../types';

interface JobDetailDrawerProps {
  job: NormalizedJob | null;
  onClose: () => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => Promise<void>;
  onSaveNotes: (jobId: string, notes: string) => Promise<void>;
  onSaveInterview: (jobId: string, date: string, round?: string) => Promise<void>;
  onSaveOffer: (jobId: string, salary: number, currency?: string) => Promise<void>;
}

export const JobDetailDrawer: React.FC<JobDetailDrawerProps> = ({
  job,
  onClose,
  onStatusChange,
  onSaveNotes,
  onSaveInterview,
  onSaveOffer,
}) => {
  const [notes, setNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewRound, setInterviewRound] = useState('');
  const [offerSalary, setOfferSalary] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'notes' | 'interview'>('details');
  const [savingNotes, setSavingNotes] = useState(false);
  const [timeline, setTimeline] = useState<ApplicationStatusHistory[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [copiedJobId, setCopiedJobId] = useState(false);

  useEffect(() => {
    if (job) {
      setNotes(job.notes || '');
      setInterviewDate(job.interviewDate || '');
      setInterviewRound(job.interviewRound || '');
      setOfferSalary(job.offerSalary ? String(job.offerSalary) : '');
      setActiveTab('details');
      setCopiedJobId(false);
    }
  }, [job]);

  useEffect(() => {
    if (job && activeTab === 'timeline') {
      setLoadingTimeline(true);
      api.getApplicationTimeline(job.id)
        .then((res) => setTimeline(res))
        .catch((err) => console.error('Failed to load application timeline:', err))
        .finally(() => setLoadingTimeline(false));
    }
  }, [job, activeTab]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!job) return null;

  const match = job.matchScore;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-out Sheet */}
      <div className="relative w-full max-w-2xl bg-surface border-l border-border h-full flex flex-col shadow-2xl z-10 animate-slide-up sm:animate-none overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-start justify-between gap-4 bg-surface-elevated/40">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-semibold text-text-main text-base flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-accent" />
                {job.company}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(job.jobId || job.id);
                  setCopiedJobId(true);
                  setTimeout(() => setCopiedJobId(false), 2000);
                }}
                className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-elevated text-accent border border-border flex items-center gap-1 hover:border-accent transition-colors"
                title="Click to copy Job ID"
              >
                {job.jobId || job.id.slice(0, 12)}
                {copiedJobId ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 opacity-60" />}
              </button>
              {job.sourceJobId && (
                <span className="font-mono text-xs text-text-muted bg-surface-elevated px-1.5 py-0.5 rounded border border-border">
                  #{job.sourceJobId}
                </span>
              )}
              <Badge variant="remote" remoteType={job.remoteType} />
              <Badge variant="status" status={job.status} />
              {match && <Badge variant="match" score={match.overallScore} />}
            </div>
            <h2 className="text-xl font-bold text-text-main leading-tight tracking-tight">
              {job.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-text-muted mt-2 flex-wrap">
              {job.location.length > 0 && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.location.join(' • ')}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatRelativeAge(job.datePosted || job.discoveredAt)}
              </span>
              <span>Source: {job.source}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-5 py-3 border-b border-border bg-surface flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant={job.status === 'SELECTED' ? 'accent' : 'secondary'}
              onClick={() => onStatusChange(job.id, job.status === 'SELECTED' ? 'NEW' : 'SELECTED')}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {job.status === 'SELECTED' ? 'Selected' : 'Select'}
            </Button>
            <Button
              size="sm"
              variant={job.status === 'SAVED' ? 'accent' : 'secondary'}
              onClick={() => onStatusChange(job.id, job.status === 'SAVED' ? 'NEW' : 'SAVED')}
            >
              <Bookmark className="w-3.5 h-3.5" />
              {job.status === 'SAVED' ? 'Saved' : 'Save'}
            </Button>
            <Button
              size="sm"
              variant={job.status === 'APPLIED' ? 'primary' : 'secondary'}
              onClick={() => onStatusChange(job.id, 'APPLIED')}
            >
              <Send className="w-3.5 h-3.5" />
              Mark Applied
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => onStatusChange(job.id, 'REJECTED')}
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </Button>
          </div>

          <a
            href={job.canonicalUrl || job.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center font-medium rounded-lg text-sm px-4 py-2 gap-2 bg-accent text-white hover:bg-accent/90 shadow-sm transition-all"
          >
            <span>Open Application</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5 text-sm font-medium">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            Job Details & Match
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Timeline {timeline.length > 0 ? `(${timeline.length})` : ''}
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            Private Notes {job.notes ? '•' : ''}
          </button>
          <button
            onClick={() => setActiveTab('interview')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'interview'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            Interview & Offer
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'details' && (
            <>
              {/* Profile Match Explanation Section */}
              {match && (
                <div className="bg-surface-elevated/70 border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-sm text-text-main">
                      <Sparkles className="w-4 h-4 text-accent" />
                      <span>Profile Match Analysis</span>
                    </div>
                    <span className="text-sm font-bold text-accent">
                      {match.overallScore}% Compatibility
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed">
                    {match.explanation.summary}
                  </p>

                  {/* Matching skills */}
                  {match.matchingSkills.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-text-muted mb-1.5">
                        Matching Skills ({match.matchingSkills.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {match.matchingSkills.map((s) => (
                          <Chip key={s} label={`✓ ${s}`} active />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing/unclear skills */}
                  {match.missingSkills.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-text-muted mb-1.5">
                        Missing or Unspecified Skills
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {match.missingSkills.map((s) => (
                          <Chip key={s} label={`• ${s}`} className="opacity-60" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Key metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-border bg-surface-elevated/40">
                  <div className="text-xs text-text-muted">Salary Range</div>
                  <div className="text-sm font-semibold text-text-main mt-0.5">
                    {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                    {job.salaryPeriod && job.salaryPeriod !== 'unknown' && job.salaryPeriod !== 'year' ? `/${job.salaryPeriod === 'hour' ? 'hr' : 'mo'}` : ''}
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-surface-elevated/40">
                  <div className="text-xs text-text-muted">Experience Required</div>
                  <div className="text-sm font-semibold text-text-main mt-0.5">
                    {job.experienceText || (job.minExperienceYears !== undefined ? `${job.minExperienceYears}${job.maxExperienceYears ? `–${job.maxExperienceYears}` : '+'} years` : 'Not specified')}
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-surface-elevated/40">
                  <div className="text-xs text-text-muted">Seniority</div>
                  <div className="text-sm font-semibold text-text-main capitalize mt-0.5">
                    {job.seniority}
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-surface-elevated/40">
                  <div className="text-xs text-text-muted">Employment Type</div>
                  <div className="text-sm font-semibold text-text-main capitalize mt-0.5">
                    {job.employmentType.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Full Description */}
              <div>
                <h3 className="text-sm font-semibold text-text-main mb-2">Job Description</h3>
                <div className="text-sm text-text-secondary whitespace-pre-line leading-relaxed font-sans bg-surface-elevated/20 p-4 rounded-xl border border-border">
                  {job.description || 'No detailed description provided by source.'}
                </div>
              </div>
            </>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-text-main">Application Lifecycle & Status History</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Complete audit trail of stage transitions for this job ({job.jobId || job.id.slice(0, 12)}).
                </p>
              </div>

              {loadingTimeline ? (
                <div className="py-8 text-center text-xs text-text-muted">Loading timeline...</div>
              ) : timeline.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-muted bg-surface-elevated/30 rounded-xl border border-border p-4">
                  No stage transitions recorded yet. Changes made via Status CTAs or the Application Tracker will appear here.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {timeline.map((event, idx) => (
                    <div key={event.id || idx} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-accent border-2 border-surface" />

                      <div className="bg-surface-elevated/40 border border-border rounded-xl p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                          <div className="flex items-center gap-2">
                            {event.oldStatus ? (
                              <>
                                <Badge variant="status" status={event.oldStatus as JobStatus} />
                                <span className="text-text-muted">→</span>
                              </>
                            ) : null}
                            <Badge variant="status" status={event.newStatus as JobStatus} />
                          </div>
                          <span className="text-[11px] text-text-muted font-mono">
                            {new Date(event.changedAt).toLocaleString()}
                          </span>
                        </div>
                        {event.notes && (
                          <p className="text-xs text-text-secondary bg-surface p-2 rounded-lg border border-border/60">
                            {event.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-text-main block mb-1.5">
                  Private Notes
                </label>
                <p className="text-xs text-text-muted mb-3">
                  These notes are stored privately in your D1 database. Perfect for referral contacts, resume tweaks, or interview prep.
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Employee referral from Alex; tailored CV with focus on TensorRT..."
                  rows={8}
                  className="w-full bg-surface-elevated border border-border rounded-xl p-3.5 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <Button
                variant="accent"
                loading={savingNotes}
                onClick={async () => {
                  setSavingNotes(true);
                  await onSaveNotes(job.id, notes);
                  setSavingNotes(false);
                }}
              >
                Save Notes
              </Button>
            </div>
          )}

          {activeTab === 'interview' && (
            <div className="space-y-5">
              <div className="border border-border p-4 rounded-xl space-y-3 bg-surface-elevated/30">
                <div className="flex items-center gap-2 font-semibold text-sm text-text-main">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span>Interview Tracking</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Interview Date & Time</label>
                    <input
                      type="datetime-local"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg p-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Interview Round</label>
                    <input
                      type="text"
                      placeholder="e.g. Technical Round 1, System Design"
                      value={interviewRound}
                      onChange={(e) => setInterviewRound(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg p-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => onSaveInterview(job.id, interviewDate, interviewRound)}
                >
                  Record Interview
                </Button>
              </div>

              <div className="border border-border p-4 rounded-xl space-y-3 bg-surface-elevated/30">
                <div className="flex items-center gap-2 font-semibold text-sm text-text-main">
                  <DollarSign className="w-4 h-4 text-success" />
                  <span>Offer Tracking</span>
                </div>
                <div>
                  <label className="text-xs text-text-muted block mb-1">Offer Compensation</label>
                  <input
                    type="number"
                    placeholder="e.g. 3500000"
                    value={offerSalary}
                    onChange={(e) => setOfferSalary(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg p-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onSaveOffer(job.id, parseFloat(offerSalary) || 0)}
                >
                  Record Offer
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
