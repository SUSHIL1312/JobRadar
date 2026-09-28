import React, { useState, useEffect } from 'react';
import { JobSearchProfile, Seniority, RemotePreference } from '../../types';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { useToast } from '../components/ui/Toast';
import { PasswordConfirmModal } from '../components/ui/PasswordConfirmModal';
import { api } from '../lib/api';
import {
  User,
  Plus,
  Save,
  Sparkles,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<JobSearchProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // Input states for tag additions
  const [newSkill, setNewSkill] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newPrefCompany, setNewPrefCompany] = useState('');
  const [newExKeyword, setNewExKeyword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getProfile();
      setProfile(data);
    } catch (err) {
      toast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      await api.saveProfile(profile);
      toast('Career profile updated successfully in D1 database', 'success');
    } catch (err) {
      toast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClearProfile = async (password: string) => {
    try {
      await api.resetProfile(password);
      setProfile({
        id: 'user_profile_main',
        fullName: '',
        email: '',
        title: '',
        yearsOfExperience: 0,
        currentRole: '',
        currentCompany: '',
        skills: [],
        jobTitles: [],
        seniorityLevels: [],
        locations: [],
        remotePreference: 'remote_preferred',
        employmentTypes: ['full_time'],
        minimumSalary: undefined,
        salaryCurrency: 'INR',
        preferredCompanies: [],
        excludedCompanies: [],
        keywords: [],
        excludedKeywords: [],
        enabledSources: ['greenhouse', 'lever', 'remotive'],
      });
      toast('Career profile cleared successfully from D1', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear profile';
      throw new Error(msg);
    }
  };

  if (loading || !profile) {
    return (
      <div className="p-8 text-center text-text-muted text-sm">
        Loading career profile...
      </div>
    );
  }

  const allSeniorities: Seniority[] = ['entry', 'junior', 'mid', 'senior', 'lead', 'staff', 'principal'];

  const toggleSeniority = (sen: Seniority) => {
    const current = profile.seniorityLevels || [];
    const exists = current.includes(sen);
    const updated = exists ? current.filter((s) => s !== sen) : [...current, sen];
    setProfile({ ...profile, seniorityLevels: updated });
  };

  const addTag = (
    field: 'skills' | 'jobTitles' | 'locations' | 'preferredCompanies' | 'excludedKeywords',
    value: string,
    clearInput: () => void
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const current = profile[field] || [];
    if (!current.includes(trimmed)) {
      setProfile({ ...profile, [field]: [...current, trimmed] });
    }
    clearInput();
  };

  const removeTag = (
    field: 'skills' | 'jobTitles' | 'locations' | 'preferredCompanies' | 'excludedKeywords',
    value: string
  ) => {
    const current = profile[field] || [];
    setProfile({ ...profile, [field]: current.filter((v) => v !== value) });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-2xl font-extrabold text-text-main tracking-tight flex items-center gap-2.5">
            <User className="w-6 h-6 text-accent" />
            Career Profile & Preferences
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Configure your technical skills, job titles, and compensation expectations. Persisted permanently in D1.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowClearModal(true)}
            className="shrink-0"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Clear Profile
          </Button>
          <Button variant="accent" loading={saving} onClick={handleSave} className="shrink-0">
            <Save className="w-4 h-4 mr-1.5" />
            Save Profile
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section 1: Basic Information & Experience */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-text-main uppercase tracking-wider text-accent flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Professional Background
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1">Full Name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full bg-surface-elevated border border-border rounded-lg p-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1">Email (for job digests)</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-surface-elevated border border-border rounded-lg p-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1">Years of Experience</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={profile.yearsOfExperience}
                onChange={(e) => setProfile({ ...profile, yearsOfExperience: parseFloat(e.target.value) || 0 })}
                className="w-full bg-surface-elevated border border-border rounded-lg p-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1">Current Company</label>
              <input
                type="text"
                placeholder="e.g. Samsung R&D"
                value={profile.currentCompany || ''}
                onChange={(e) => setProfile({ ...profile, currentCompany: e.target.value })}
                className="w-full bg-surface-elevated border border-border rounded-lg p-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1">Current Role</label>
              <input
                type="text"
                placeholder="e.g. Software Engineer"
                value={profile.currentRole || ''}
                onChange={(e) => setProfile({ ...profile, currentRole: e.target.value })}
                className="w-full bg-surface-elevated border border-border rounded-lg p-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1">Education Background</label>
              <input
                type="text"
                placeholder="e.g. M.Tech Computer Science, IIT Guwahati"
                value={profile.education || ''}
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                className="w-full bg-surface-elevated border border-border rounded-lg p-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Technical Skills */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-main uppercase tracking-wider text-accent flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Technical Skills & Tools ({profile.skills.length})
            </h3>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add skill (e.g. C++, PyTorch, CUDA, Linux, OpenGL)..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag('skills', newSkill, () => setNewSkill(''))}
              className="flex-1 bg-surface-elevated border border-border rounded-lg p-2 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => addTag('skills', newSkill, () => setNewSkill(''))}
            >
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2">
            {profile.skills.map((skill) => (
              <Chip
                key={skill}
                label={skill}
                active
                onRemove={() => removeTag('skills', skill)}
              />
            ))}
          </div>
        </div>

        {/* Section 3: Target Job Titles */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-text-main uppercase tracking-wider text-accent flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Target Job Titles ({profile.jobTitles.length})
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add title (e.g. Senior C++ Engineer, ML Engineer)..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag('jobTitles', newTitle, () => setNewTitle(''))}
              className="flex-1 bg-surface-elevated border border-border rounded-lg p-2 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => addTag('jobTitles', newTitle, () => setNewTitle(''))}
            >
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2">
            {profile.jobTitles.map((title) => (
              <Chip
                key={title}
                label={title}
                onRemove={() => removeTag('jobTitles', title)}
              />
            ))}
          </div>
        </div>

        {/* Section 4: Seniority & Remote Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Seniority */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-text-main uppercase tracking-wider text-accent">
              Seniority Preferences
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {allSeniorities.map((sen) => {
                const checked = profile.seniorityLevels.includes(sen);
                return (
                  <label
                    key={sen}
                    onClick={() => toggleSeniority(sen)}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                      checked
                        ? 'bg-accent/15 border-accent/40 text-text-main font-semibold'
                        : 'bg-surface-elevated border-border text-text-secondary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="sr-only"
                    />
                    <span className="capitalize">{sen}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Remote Preference & Priority */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-text-main uppercase tracking-wider text-accent">
              Remote Work Mode
            </h3>
            <div className="space-y-2 text-xs">
              {[
                { value: 'remote_only', label: 'Remote Only (strictly 100% WFH)' },
                { value: 'remote_preferred', label: 'Remote Preferred (flexible for great roles)' },
                { value: 'hybrid_ok', label: 'Hybrid Acceptable' },
                { value: 'any', label: 'Any (including on-site)' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                    profile.remotePreference === opt.value
                      ? 'bg-accent/15 border-accent/40 text-text-main font-semibold'
                      : 'bg-surface-elevated border-border text-text-secondary'
                  }`}
                >
                  <input
                    type="radio"
                    name="remotePref"
                    value={opt.value}
                    checked={profile.remotePreference === opt.value}
                    onChange={(e) => setProfile({ ...profile, remotePreference: e.target.value as RemotePreference })}
                    className="accent-accent"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            {/* Remote Priority */}
            <div className="pt-3 border-t border-border mt-3">
              <label className="text-xs font-bold text-text-muted block mb-1">
                Remote Search Priority
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { value: 'highest', label: '🔥 Highest (Remote-First)' },
                  { value: 'high', label: 'High Priority' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'low', label: 'Low' },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setProfile({ ...profile, remotePriority: p.value as any })}
                    className={`p-2 rounded-lg border text-left font-medium transition-colors ${
                      (profile.remotePriority || 'highest') === p.value
                        ? 'bg-accent/15 border-accent/40 text-accent font-bold'
                        : 'bg-surface-elevated border-border text-text-secondary hover:text-text-main'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Locations & Multi-Tier Compensation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-text-main uppercase tracking-wider text-accent flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Preferred Locations
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add location (e.g. India, Remote, Bengaluru)..."
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag('locations', newLocation, () => setNewLocation(''))}
                className="flex-1 bg-surface-elevated border border-border rounded-lg p-2 text-sm text-text-main placeholder:text-text-muted focus:outline-none"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => addTag('locations', newLocation, () => setNewLocation(''))}
              >
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {profile.locations.map((loc) => (
                <Chip
                  key={loc}
                  label={loc}
                  onRemove={() => removeTag('locations', loc)}
                />
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-text-main uppercase tracking-wider text-accent flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Compensation & Strategy
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">Target Base Salary</label>
                <input
                  type="number"
                  placeholder="e.g. 4000000"
                  value={profile.targetBase || profile.minimumSalary || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || undefined;
                    setProfile({ ...profile, targetBase: val, minimumSalary: val });
                  }}
                  className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-sm text-text-main focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">Target Total Comp (TC)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000000"
                  value={profile.targetTc || ''}
                  onChange={(e) => setProfile({ ...profile, targetTc: parseFloat(e.target.value) || undefined })}
                  className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-sm text-text-main focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">Current Base</label>
                <input
                  type="number"
                  placeholder="e.g. 2150000"
                  value={profile.currentCompensationBase || ''}
                  onChange={(e) => setProfile({ ...profile, currentCompensationBase: parseFloat(e.target.value) || undefined })}
                  className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-sm text-text-main focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">Currency</label>
                <select
                  value={profile.salaryCurrency || 'INR'}
                  onChange={(e) => setProfile({ ...profile, salaryCurrency: e.target.value })}
                  className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-sm text-text-main focus:outline-none"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
              <span className="font-bold">🛡️ High-Compensation Opportunity Protection Active:</span> Undisclosed salaries and high-equity packages will never be filtered out automatically.
            </div>
          </div>
        </div>

        {/* Section 6: Preferred Companies & Excluded Keywords */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-text-main uppercase tracking-wider text-accent flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Preferred Companies (Ranking Boost)
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add company (e.g. NVIDIA, Google)..."
                value={newPrefCompany}
                onChange={(e) => setNewPrefCompany(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag('preferredCompanies', newPrefCompany, () => setNewPrefCompany(''))}
                className="flex-1 bg-surface-elevated border border-border rounded-lg p-2 text-sm text-text-main placeholder:text-text-muted focus:outline-none"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => addTag('preferredCompanies', newPrefCompany, () => setNewPrefCompany(''))}
              >
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {profile.preferredCompanies.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  active
                  onRemove={() => removeTag('preferredCompanies', c)}
                />
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-danger uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Exclusion Rules (Disqualifiers)
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add exclusion (e.g. intern, sales, unpaid)..."
                value={newExKeyword}
                onChange={(e) => setNewExKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag('excludedKeywords', newExKeyword, () => setNewExKeyword(''))}
                className="flex-1 bg-surface-elevated border border-border rounded-lg p-2 text-sm text-text-main placeholder:text-text-muted focus:outline-none"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => addTag('excludedKeywords', newExKeyword, () => setNewExKeyword(''))}
              >
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {profile.excludedKeywords.map((k) => (
                <Chip
                  key={k}
                  label={k}
                  className="bg-danger/10 text-danger border-danger/20"
                  onRemove={() => removeTag('excludedKeywords', k)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <PasswordConfirmModal
        isOpen={showClearModal}
        title="Clear Entire Career Profile?"
        description="This will permanently delete your stored career profile, skills, target titles, company preferences, and experience from Cloudflare D1 so you can configure everything fresh."
        confirmButtonText="Yes, Wipe Profile"
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearProfile}
      />
    </div>
  );
};
