import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { BarChart3, TrendingUp, Building2, Radio, Globe, Layers } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const funnelSteps = [
    { label: 'Discovered', count: analytics?.totalJobs || 0, color: 'bg-blue-500' },
    { label: 'Selected', count: analytics?.statusCounts?.SELECTED || 0, color: 'bg-cyan-500' },
    { label: 'Applied', count: analytics?.statusCounts?.APPLIED || 0, color: 'bg-indigo-500' },
    { label: 'Interviews', count: analytics?.statusCounts?.INTERVIEW || 0, color: 'bg-amber-500' },
    { label: 'Offers', count: analytics?.statusCounts?.OFFER || 0, color: 'bg-emerald-500' },
  ];

  const maxFunnelCount = Math.max(...funnelSteps.map((s) => s.count), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-text-main tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-accent" />
          Job Discovery & Application Analytics
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Authoritative metrics computed directly from your personal Cloudflare D1 database.
        </p>
      </div>

      {/* Application Funnel */}
      <Card className="p-5 bg-surface border-border space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-text-main">
          <Layers className="w-4 h-4 text-accent" />
          <span>Application Conversion Funnel</span>
        </div>

        <div className="space-y-3">
          {funnelSteps.map((step) => {
            const percentage = Math.round((step.count / maxFunnelCount) * 100);
            return (
              <div key={step.label} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-text-main">{step.label}</span>
                  <span className="font-mono text-text-muted">
                    {step.count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-surface-elevated rounded-full overflow-hidden border border-border">
                  <div
                    className={`h-full ${step.color} transition-all duration-500 rounded-full`}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Grid: Top Companies & Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Companies */}
        <Card className="p-5 bg-surface border-border space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-text-main">
            <Building2 className="w-4 h-4 text-accent" />
            <span>Top Companies Discovered</span>
          </div>

          <div className="space-y-2">
            {(analytics?.topCompanies || []).length === 0 ? (
              <div className="text-xs text-text-muted py-4 text-center">No company data yet.</div>
            ) : (
              analytics.topCompanies.map((c: any) => (
                <div
                  key={c.company}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated/40 border border-border text-xs"
                >
                  <span className="font-semibold text-text-main">{c.company}</span>
                  <span className="font-mono text-text-muted font-bold px-2 py-0.5 rounded bg-surface border border-border">
                    {c.count} jobs
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Source Yield */}
        <Card className="p-5 bg-surface border-border space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-text-main">
            <Radio className="w-4 h-4 text-accent" />
            <span>Yield by Job Source</span>
          </div>

          <div className="space-y-2">
            {(analytics?.topSources || []).length === 0 ? (
              <div className="text-xs text-text-muted py-4 text-center">No source data yet.</div>
            ) : (
              analytics.topSources.map((s: any) => (
                <div
                  key={s.source}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated/40 border border-border text-xs"
                >
                  <span className="font-semibold text-text-main capitalize">{s.source}</span>
                  <span className="font-mono text-accent font-bold px-2 py-0.5 rounded bg-surface border border-border">
                    {s.count} discovered
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Remote vs Onsite & 7-Day Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 bg-surface border-border space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-text-main">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Workplace Distribution</span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {(analytics?.remoteDistribution || []).map((r: any) => (
              <div
                key={r.remote_type}
                className="p-3 rounded-xl bg-surface-elevated/50 border border-border text-center"
              >
                <div className="text-xl font-black text-text-main">{r.count}</div>
                <div className="text-xs font-medium text-text-muted capitalize mt-1">
                  {r.remote_type}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-surface border-border space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-text-main">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span>7-Day Discovery Trend</span>
          </div>

          <div className="space-y-2">
            {(analytics?.dailyTrend || []).length === 0 ? (
              <div className="text-xs text-text-muted py-4 text-center">Trend data accumulating.</div>
            ) : (
              analytics.dailyTrend.map((d: any) => (
                <div
                  key={d.day}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated/30 border border-border text-xs"
                >
                  <span className="font-mono text-text-secondary">{d.day}</span>
                  <span className="font-mono font-bold text-text-main">+{d.count} new</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
