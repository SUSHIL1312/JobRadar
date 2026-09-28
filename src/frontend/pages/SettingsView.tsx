import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/api';
import {
  BackendSearchConfig,
  BackendMatchingConfig,
  BackendNotificationConfig,
  SecretStatus,
} from '../../types';
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
  Sliders,
  Bell,
  Sparkles,
  AlertCircle,
  Save,
  Check,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { toast } = useToast();
  const [resetting, setResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Dynamic D1 Settings State
  const [searchConfig, setSearchConfig] = useState<BackendSearchConfig>({
    maxRuntimeMs: 300000,
    maxExternalRequestsPerRun: 40,
    maxPagesPerSource: 3,
    freshnessHorizon: '7d',
    staggerDelayMs: 500,
    cooldownMs: 300000,
  });

  const [matchingConfig, setMatchingConfig] = useState<BackendMatchingConfig>({
    weights: {
      title: 35,
      skills: 30,
      seniority: 10,
      experience: 15,
      location: 10,
    },
    preferredCompanyBonus: 10,
    minScoreThreshold: 40,
  });

  const [notificationConfig, setNotificationConfig] = useState<BackendNotificationConfig>({
    emailEnabled: false,
    emailRecipient: '',
    minScoreForNotification: 60,
    maxJobsPerEmail: 15,
    notifyOnZeroJobs: false,
  });

  const [secretsStatus, setSecretsStatus] = useState<SecretStatus>({
    resendApiKeyConfigured: false,
    authSecretConfigured: false,
  });

  const [savingSearch, setSavingSearch] = useState(false);
  const [savingMatching, setSavingMatching] = useState(false);
  const [savingNotification, setSavingNotification] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getSearchConfig().then(setSearchConfig).catch(console.error),
      api.getMatchingConfig().then(setMatchingConfig).catch(console.error),
      api.getNotificationConfig().then(setNotificationConfig).catch(console.error),
      api.getSecretsStatus().then(setSecretsStatus).catch(console.error),
    ]);
  }, []);

  const cronSchedules = [
    { ist: '08:00 AM IST', utc: '02:30 UTC', cron: '30 2 * * *', label: 'Morning Primary Scan' },
    { ist: '10:00 AM IST', utc: '04:30 UTC', cron: '30 4 * * *', label: 'Morning Remote & ATS Refresh' },
    { ist: '01:00 PM IST', utc: '07:30 UTC', cron: '30 7 * * *', label: 'Mid-Day Scan' },
    { ist: '05:00 PM IST', utc: '11:30 UTC', cron: '30 11 * * *', label: 'Evening Europe/Global Openings' },
    { ist: '09:00 PM IST', utc: '15:30 UTC', cron: '30 15 * * *', label: 'Night Comprehensive Scan' },
  ];

  const handleSaveSearch = async () => {
    try {
      setSavingSearch(true);
      await api.saveSearchConfig(searchConfig);
      toast('Search engine configuration saved to D1', 'success');
    } catch {
      toast('Failed to save search configuration', 'error');
    } finally {
      setSavingSearch(false);
    }
  };

  const handleSaveMatching = async () => {
    try {
      setSavingMatching(true);
      await api.saveMatchingConfig(matchingConfig);
      toast('Matching weights saved to D1', 'success');
    } catch {
      toast('Failed to save matching weights', 'error');
    } finally {
      setSavingMatching(false);
    }
  };

  const handleSaveNotification = async () => {
    try {
      setSavingNotification(true);
      await api.saveNotificationConfig(notificationConfig);
      toast('Notification settings saved to D1', 'success');
    } catch {
      toast('Failed to save notification settings', 'error');
    } finally {
      setSavingNotification(false);
    }
  };

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
          Settings & Backend Configuration
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Cloudflare D1 is the authoritative source of truth for all search limits, matching weights, and notification rules.
        </p>
      </div>

      {/* 1. Cloudflare Worker Secrets Status */}
      <Card className="p-5 bg-surface border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-text-main">
            <Key className="w-4 h-4 text-accent" />
            <span>Cloudflare Secrets (Sensitive Vault)</span>
          </div>
          <span className="text-[11px] text-text-muted font-mono">Managed via Wrangler</span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          Sensitive API credentials live strictly in Cloudflare Worker Secrets and are never stored in D1 or returned as plaintext to the browser:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-border bg-surface-elevated/40 flex items-center justify-between">
            <div>
              <div className="font-mono text-xs font-semibold text-text-main">RESEND_API_KEY</div>
              <div className="text-[11px] text-text-muted mt-0.5">Automated email job digests</div>
              <div className="font-mono text-xs text-text-muted mt-1">
                {secretsStatus.resendApiKeyConfigured ? '●●●●●●●●●●●●' : '(not configured)'}
              </div>
            </div>
            {secretsStatus.resendApiKeyConfigured ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <AlertCircle className="w-3.5 h-3.5" /> Missing
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface-elevated/40 flex items-center justify-between">
            <div>
              <div className="font-mono text-xs font-semibold text-text-main">AUTH_SECRET</div>
              <div className="text-[11px] text-text-muted mt-0.5">API & endpoint authentication</div>
              <div className="font-mono text-xs text-text-muted mt-1">
                {secretsStatus.authSecretConfigured ? '●●●●●●●●●●●●' : '(public personal mode)'}
              </div>
            </div>
            {secretsStatus.authSecretConfigured ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" /> Enforced
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-text-muted bg-surface px-2.5 py-1 rounded-full border border-border">
                Optional
              </span>
            )}
          </div>
        </div>

        <div className="bg-background rounded-lg p-3 font-mono text-xs text-text-main space-y-1.5 border border-border">
          <div className="flex items-center gap-2 text-text-muted text-[11px]">
            <Terminal className="w-3.5 h-3.5" />
            <span>To update secrets in Cloudflare:</span>
          </div>
          <div className="text-text-secondary">npx wrangler secret put RESEND_API_KEY</div>
        </div>
      </Card>

      {/* 2. Search Engine Budget & Freshness Configuration */}
      <Card className="p-5 bg-surface border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-text-main">
            <Sliders className="w-4 h-4 text-accent" />
            <span>Search Budget & Discovery Controls (D1)</span>
          </div>
          <Button
            size="sm"
            variant="accent"
            loading={savingSearch}
            onClick={handleSaveSearch}
          >
            <Save className="w-3.5 h-3.5" />
            Save Search Settings
          </Button>
        </div>
        <p className="text-xs text-text-secondary">
          Controls how polite and extensive each scheduled or manual discovery scan is. Changes take effect on the very next scan without redeployment.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="text-xs font-semibold text-text-main block mb-1">
              Freshness Horizon
            </label>
            <select
              value={searchConfig.freshnessHorizon}
              onChange={(e) => setSearchConfig({ ...searchConfig, freshnessHorizon: e.target.value })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2.5 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <option value="24h">Past 24 Hours</option>
              <option value="48h">Past 48 Hours</option>
              <option value="3d">Past 3 Days</option>
              <option value="7d">Past 7 Days (Default)</option>
              <option value="14d">Past 14 Days</option>
              <option value="30d">Past 30 Days</option>
              <option value="all">All Available</option>
            </select>
            <p className="text-[11px] text-text-muted mt-1">Discards jobs posted earlier than this cutoff.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-main block mb-1">
              Max Requests Per Run
            </label>
            <input
              type="number"
              value={searchConfig.maxExternalRequestsPerRun}
              onChange={(e) => setSearchConfig({ ...searchConfig, maxExternalRequestsPerRun: parseInt(e.target.value, 10) || 40 })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2.5 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <p className="text-[11px] text-text-muted mt-1">Request quota ceiling to ensure politeness.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-main block mb-1">
              Max Pages Per Source
            </label>
            <input
              type="number"
              value={searchConfig.maxPagesPerSource}
              onChange={(e) => setSearchConfig({ ...searchConfig, maxPagesPerSource: parseInt(e.target.value, 10) || 3 })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2.5 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <p className="text-[11px] text-text-muted mt-1">Pagination limit per API source.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-main block mb-1">
              Stagger Delay (ms)
            </label>
            <input
              type="number"
              step={100}
              value={searchConfig.staggerDelayMs}
              onChange={(e) => setSearchConfig({ ...searchConfig, staggerDelayMs: parseInt(e.target.value, 10) || 500 })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2.5 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <p className="text-[11px] text-text-muted mt-1">Politeness pause between requests.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-main block mb-1">
              Max Execution Time (ms)
            </label>
            <input
              type="number"
              step={5000}
              value={searchConfig.maxRuntimeMs}
              onChange={(e) => setSearchConfig({ ...searchConfig, maxRuntimeMs: parseInt(e.target.value, 10) || 300000 })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2.5 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <p className="text-[11px] text-text-muted mt-1">Hard timeout before partial exit.</p>
          </div>
        </div>
      </Card>

      {/* 3. Matching Weights & Scoring Engine Tuning */}
      <Card className="p-5 bg-surface border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-text-main">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Matching Algorithm Weights (D1)</span>
          </div>
          <Button
            size="sm"
            variant="accent"
            loading={savingMatching}
            onClick={handleSaveMatching}
          >
            <Save className="w-3.5 h-3.5" />
            Save Matching Weights
          </Button>
        </div>
        <p className="text-xs text-text-secondary">
          Configure how JobRadar scores prospective jobs. Sum of weights determines relative importance of criteria.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-text-main block mb-1">Title Weight</label>
            <input
              type="number"
              value={matchingConfig.weights.title}
              onChange={(e) => setMatchingConfig({
                ...matchingConfig,
                weights: { ...matchingConfig.weights, title: parseInt(e.target.value, 10) || 0 }
              })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-xs text-text-main focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-main block mb-1">Skills Weight</label>
            <input
              type="number"
              value={matchingConfig.weights.skills}
              onChange={(e) => setMatchingConfig({
                ...matchingConfig,
                weights: { ...matchingConfig.weights, skills: parseInt(e.target.value, 10) || 0 }
              })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-xs text-text-main focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-main block mb-1">Experience Weight</label>
            <input
              type="number"
              value={matchingConfig.weights.experience}
              onChange={(e) => setMatchingConfig({
                ...matchingConfig,
                weights: { ...matchingConfig.weights, experience: parseInt(e.target.value, 10) || 0 }
              })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-xs text-text-main focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-main block mb-1">Seniority Weight</label>
            <input
              type="number"
              value={matchingConfig.weights.seniority}
              onChange={(e) => setMatchingConfig({
                ...matchingConfig,
                weights: { ...matchingConfig.weights, seniority: parseInt(e.target.value, 10) || 0 }
              })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-xs text-text-main focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-main block mb-1">Location Weight</label>
            <input
              type="number"
              value={matchingConfig.weights.location}
              onChange={(e) => setMatchingConfig({
                ...matchingConfig,
                weights: { ...matchingConfig.weights, location: parseInt(e.target.value, 10) || 0 }
              })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-xs text-text-main focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
          <div>
            <label className="text-xs font-semibold text-text-main block mb-1">
              Preferred Company Bonus Points
            </label>
            <input
              type="number"
              value={matchingConfig.preferredCompanyBonus}
              onChange={(e) => setMatchingConfig({
                ...matchingConfig,
                preferredCompanyBonus: parseInt(e.target.value, 10) || 0
              })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-xs text-text-main focus:outline-none"
            />
            <p className="text-[11px] text-text-muted mt-1">Score boost added if company matches your preferred companies list.</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-main block mb-1">
              Minimum Score Threshold
            </label>
            <input
              type="number"
              value={matchingConfig.minScoreThreshold}
              onChange={(e) => setMatchingConfig({
                ...matchingConfig,
                minScoreThreshold: parseInt(e.target.value, 10) || 0
              })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-xs text-text-main focus:outline-none"
            />
            <p className="text-[11px] text-text-muted mt-1">Jobs below this score will not be flagged as matches.</p>
          </div>
        </div>
      </Card>

      {/* 4. Notification & Digest Configuration */}
      <Card className="p-5 bg-surface border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-text-main">
            <Bell className="w-4 h-4 text-accent" />
            <span>Notification & Email Digest Rules (D1)</span>
          </div>
          <Button
            size="sm"
            variant="accent"
            loading={savingNotification}
            onClick={handleSaveNotification}
          >
            <Save className="w-3.5 h-3.5" />
            Save Notifications
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationConfig.emailEnabled}
                onChange={(e) => setNotificationConfig({ ...notificationConfig, emailEnabled: e.target.checked })}
                className="rounded border-border text-accent focus:ring-accent"
              />
              <span className="text-xs font-semibold text-text-main">Enable Automated Email Digests</span>
            </label>

            <div>
              <label className="text-xs font-semibold text-text-main block mb-1">Recipient Email</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={notificationConfig.emailRecipient}
                onChange={(e) => setNotificationConfig({ ...notificationConfig, emailRecipient: e.target.value })}
                className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-xs text-text-main focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-text-main block mb-1">Minimum Match Score for Notification</label>
              <input
                type="number"
                value={notificationConfig.minScoreForNotification}
                onChange={(e) => setNotificationConfig({ ...notificationConfig, minScoreForNotification: parseInt(e.target.value, 10) || 60 })}
                className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-xs text-text-main focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text-main block mb-1">Max Jobs per Email</label>
              <input
                type="number"
                value={notificationConfig.maxJobsPerEmail}
                onChange={(e) => setNotificationConfig({ ...notificationConfig, maxJobsPerEmail: parseInt(e.target.value, 10) || 15 })}
                className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-xs text-text-main focus:outline-none"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 5. Cloudflare Cron Trigger Matrix */}
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
