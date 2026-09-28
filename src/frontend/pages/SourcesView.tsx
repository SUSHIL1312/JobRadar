import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Radio, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export const SourcesView: React.FC = () => {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      setLoading(true);
      const data = await api.getSources();
      setSources(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-text-main tracking-tight flex items-center gap-2">
          <Radio className="w-6 h-6 text-accent" />
          Configured Job Discovery Sources
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Legitimate, public APIs and ATS platforms registered for scheduled discovery.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((src) => (
          <Card key={src.id} className="p-5 bg-surface border-border space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-text-main">{src.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-text-muted uppercase">
                    {src.type}
                  </span>
                </div>
                <div className="text-xs text-text-muted mt-1">
                  ID: <span className="font-mono">{src.id}</span> • Priority: {src.priority}
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
              </span>
            </div>

            {/* Capabilities */}
            {src.capabilities && (
              <div className="pt-2 border-t border-border-subtle grid grid-cols-2 gap-2 text-xs text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  <span>Rate Limit: {src.capabilities.rateLimitPerMinute} req/min</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Exact Salary: {src.capabilities.providesExactSalary ? 'Yes' : 'Varies'}</span>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
