import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { SearchRunResult } from '../../types';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { History, CheckCircle2, AlertTriangle, XCircle, Clock, Loader2 } from 'lucide-react';

export const SearchRunsView: React.FC = () => {
  const [runs, setRuns] = useState<SearchRunResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRuns();
    // Poll every 15s to update live scanning progress
    const interval = setInterval(loadRuns, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadRuns = async () => {
    try {
      const data = await api.getSearchRuns();
      setRuns(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-text-main tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-accent" />
          Autonomous Search Runs History
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Detailed inspection log of scheduled cron triggers and manual search runs.
        </p>
      </div>

      {runs.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl text-text-muted text-sm">
          No search runs recorded yet. Use the "Run Search Now" button to execute your initial discovery scan.
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((r: any) => {
            const isRunning = r.status === 'RUNNING';
            const isCompleted = r.status === 'COMPLETED';
            const isPartial = r.status === 'PARTIAL';
            const durationSec = Math.round((r.duration_ms || 0) / 1000);

            return (
              <Card key={r.id} className="p-4 bg-surface border-border space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {isRunning ? (
                      <Loader2 className="w-5 h-5 text-accent animate-spin shrink-0" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    ) : isPartial ? (
                      <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-danger shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-bold text-text-main flex items-center gap-2">
                        <span className="uppercase font-mono text-xs">{r.trigger_type} Run</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isRunning
                              ? 'bg-accent/15 text-accent border border-accent/30 animate-pulse'
                              : isCompleted
                              ? 'bg-success/15 text-success border border-success/30'
                              : isPartial
                              ? 'bg-warning/15 text-warning border border-warning/30'
                              : 'bg-danger/15 text-danger border border-danger/30'
                          }`}
                        >
                          {isRunning ? 'In Progress (10–12m Deep Scan)' : r.status}
                        </span>
                      </div>
                      <div className="text-xs text-text-muted mt-0.5 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(r.started_at).toLocaleString()}</span>
                        <span>•</span>
                        <span>
                          {isRunning
                            ? 'Scanning 30 companies & remote boards live (~10–12m)...'
                            : `Duration: ${durationSec}s`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Badges */}
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="px-2.5 py-1 rounded-md bg-surface-elevated border border-border text-text-main font-semibold">
                      +{r.jobs_new} New Jobs
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-surface-elevated border border-border text-text-muted">
                      {r.jobs_duplicates} Duplicates
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-accent/15 border border-accent/30 text-accent font-semibold">
                      {r.jobs_matching} Matches
                    </span>
                  </div>
                </div>

                {r.error_summary && (
                  <div className="text-xs text-warning bg-warning/10 border border-warning/20 p-2.5 rounded-lg">
                    {r.error_summary}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
