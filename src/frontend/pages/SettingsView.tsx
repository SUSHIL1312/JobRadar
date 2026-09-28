import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/api';
import {
  Settings,
  Clock,
  Download,
  Trash2,
  Key,
  ShieldAlert,
  FileSpreadsheet,
  FileCode,
  Terminal,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { toast } = useToast();
  const [resetting, setResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const cronSchedules = [
    { ist: '08:00 AM IST', utc: '02:30 UTC', cron: '30 2 * * *', label: 'Morning Primary Scan' },
    { ist: '10:00 AM IST', utc: '04:30 UTC', cron: '30 4 * * *', label: 'Morning Remote & ATS Refresh' },
    { ist: '01:00 PM IST', utc: '07:30 UTC', cron: '30 7 * * *', label: 'Mid-Day Scan' },
    { ist: '05:00 PM IST', utc: '11:30 UTC', cron: '30 11 * * *', label: 'Evening Europe/Global Openings' },
    { ist: '09:00 PM IST', utc: '15:30 UTC', cron: '30 15 * * *', label: 'Night Comprehensive Scan' },
  ];

  const handleReset = async () => {
    try {
      setResetting(true);
      await api.resetJobs();
      toast('All jobs and discovery history reset successfully', 'success');
      setShowConfirmReset(false);
      window.location.reload();
    } catch {
      toast('Failed to reset jobs', 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    window.open(`/api/export?format=${format}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-text-main tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-accent" />
          Settings & Autonomous Infrastructure
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Cloudflare Cron automation schedules, security secrets, and data export tools.
        </p>
      </div>

      {/* Cloudflare Cron Trigger Matrix */}
      <Card className="p-5 bg-surface border-border space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-text-main">
          <Clock className="w-4 h-4 text-accent" />
          <span>Autonomous Cron Schedule (IST ↔ UTC Mappings)</span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          Cloudflare Cron Triggers execute strictly in UTC. The Worker is pre-configured with the exact 5 daily discovery intervals mapped to Indian Standard Time (IST):
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-elevated text-text-muted font-mono uppercase">
              <tr>
                <th className="p-2.5 rounded-l-lg">IST Time</th>
                <th className="p-2.5">Cloudflare UTC</th>
                <th className="p-2.5">Cron Syntax</th>
                <th className="p-2.5 rounded-r-lg">Scan Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cronSchedules.map((s) => (
                <tr key={s.ist} className="hover:bg-surface-elevated/30">
                  <td className="p-2.5 font-bold text-text-main">{s.ist}</td>
                  <td className="p-2.5 font-mono text-accent">{s.utc}</td>
                  <td className="p-2.5 font-mono text-text-muted bg-surface-elevated/40 rounded">{s.cron}</td>
                  <td className="p-2.5 text-text-secondary">{s.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cloudflare Worker Secrets Reference */}
      <Card className="p-5 bg-surface border-border space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-text-main">
          <Key className="w-4 h-4 text-accent" />
          <span>Cloudflare Secrets Management</span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          In strict compliance with architectural rules, secrets are never committed to git or exposed to the client. Set your secrets using the Wrangler CLI:
        </p>

        <div className="bg-background rounded-lg p-3.5 font-mono text-xs text-text-main space-y-2 border border-border">
          <div className="flex items-center gap-2 text-text-muted text-[11px]">
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal commands:</span>
          </div>
          <div className="text-accent"># Set Resend API key for automated email digests:</div>
          <div>npx wrangler secret put RESEND_API_KEY</div>
          <div className="text-accent mt-2"># Set optional bearer token for private API access:</div>
          <div>npx wrangler secret put AUTH_SECRET</div>
        </div>
      </Card>

      {/* Data Export & Backup */}
      <Card className="p-5 bg-surface border-border space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-text-main">
          <Download className="w-4 h-4 text-accent" />
          <span>Data Export & Archival</span>
        </div>
        <p className="text-xs text-text-secondary">
          Export your stored jobs, profile, and application history for spreadsheet analysis or backup.
        </p>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => handleExport('csv')}>
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleExport('json')}>
            <FileCode className="w-4 h-4 text-blue-400" />
            <span>Export JSON</span>
          </Button>
        </div>
      </Card>

      {/* Danger Zone: Data Reset */}
      <Card className="p-5 bg-surface border-danger/30 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-danger">
          <ShieldAlert className="w-4 h-4" />
          <span>Danger Zone: Database Reset</span>
        </div>
        <p className="text-xs text-text-secondary">
          Permanently deletes all stored jobs, matches, and application history from Cloudflare D1. Career profile is preserved.
        </p>

        {showConfirmReset ? (
          <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 space-y-3">
            <p className="text-xs font-semibold text-danger">
              Are you sure? This action cannot be undone. All discovered jobs will be purged.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="danger" size="sm" loading={resetting} onClick={handleReset}>
                Yes, Reset All Jobs
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowConfirmReset(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="danger" size="sm" onClick={() => setShowConfirmReset(true)}>
            <Trash2 className="w-4 h-4 mr-1.5" />
            Reset Job History
          </Button>
        )}
      </Card>
    </div>
  );
};
