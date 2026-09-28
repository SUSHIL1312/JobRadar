import React, { useState } from 'react';
import { FilterState, JobStatus, RemoteType } from '../../types';
import { Search, SlidersHorizontal, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  onReset: () => void;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  onReset,
  totalCount,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const presets: Array<{ label: string; state: Partial<FilterState> }> = [
    { label: 'All Jobs', state: { status: 'ALL', ageHorizon: 'all', minScore: undefined, minBaseSalary: undefined } },
    { label: '🔥 New (<24h)', state: { ageHorizon: '24h', minScore: undefined } },
    { label: '⭐ Matches (≥75%)', state: { minScore: 75 } },
    { label: '🌎 Remote', state: { remote: 'remote' as RemoteType } },
    { label: '💰 ₹40L+ / High TC', state: { minBaseSalary: 4000000, includeUndisclosedSalary: true } },
    { label: '🎯 Selected', state: { status: 'SELECTED' as JobStatus } },
    { label: '📝 Applied', state: { status: 'APPLIED' as JobStatus } },
  ];

  const handlePresetClick = (presetState: Partial<FilterState>) => {
    onFilterChange({
      ...filter,
      ...presetState,
      page: 1,
    });
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-3 shadow-xs">
      {/* Search Input & Quick Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Global Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by role, company, or skills (e.g. C++, Computer Vision, NVIDIA)..."
            value={filter.searchQuery || ''}
            onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value, page: 1 })}
            className="w-full bg-surface-elevated border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
          <select
            value={filter.sort || 'fresh_match'}
            onChange={(e) => onFilterChange({ ...filter, sort: e.target.value as any, page: 1 })}
            className="bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="fresh_match">Sort: Fresh + Match</option>
            <option value="newest">Sort: Newest First</option>
            <option value="match_desc">Sort: Highest Match</option>
            <option value="salary_desc">Sort: Salary (High → Low)</option>
            <option value="company">Sort: Company Name</option>
          </select>

          <Button
            size="md"
            variant={showAdvanced ? 'accent' : 'secondary'}
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>

          <Button
            size="md"
            variant="ghost"
            onClick={onReset}
            title="Reset all filters"
            className="shrink-0 text-text-muted hover:text-text-main"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Filter Presets Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-text-muted mr-1 font-medium shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-accent" /> Presets:
        </span>
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePresetClick(p.state)}
            className="px-2.5 py-1 rounded-md bg-surface-elevated hover:bg-surface-hover border border-border text-text-secondary hover:text-text-main font-medium shrink-0 transition-colors"
          >
            {p.label}
          </button>
        ))}
        <span className="ml-auto text-text-muted shrink-0 pl-2 font-medium">
          {totalCount} jobs found
        </span>
      </div>

      {/* Collapsible Advanced Filters */}
      {showAdvanced && (
        <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 animate-fade-in text-xs">
          {/* Status Filter */}
          <div>
            <label className="text-text-muted font-medium block mb-1">Application Stage</label>
            <select
              value={filter.status || 'ALL'}
              onChange={(e) => onFilterChange({ ...filter, status: e.target.value as any, page: 1 })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-text-main focus:outline-none"
            >
              <option value="ALL">All Stages</option>
              <option value="NEW">New (Unreviewed)</option>
              <option value="SAVED">Saved</option>
              <option value="SELECTED">Selected</option>
              <option value="APPLIED">Applied</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFER">Offer</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Requisition Availability Filter */}
          <div>
            <label className="text-text-muted font-medium block mb-1">Requisition Status</label>
            <select
              value={filter.availability || 'ALL'}
              onChange={(e) => onFilterChange({ ...filter, availability: e.target.value as any, page: 1 })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-text-main focus:outline-none"
            >
              <option value="ALL">All (Active & Closed)</option>
              <option value="ACTIVE">🟢 Verified Active</option>
              <option value="UNVERIFIED">🟡 Unverified</option>
              <option value="EXPIRED">🔴 Closed / Expired</option>
            </select>
          </div>

          {/* Location & Remote Dimension */}
          <div>
            <label className="text-text-muted font-medium block mb-1">Location Target</label>
            <select
              value={filter.location || 'ALL'}
              onChange={(e) => onFilterChange({ ...filter, location: e.target.value === 'ALL' ? undefined : e.target.value, page: 1 })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-text-main focus:outline-none"
            >
              <option value="ALL">All Locations</option>
              <option value="India">India (All)</option>
              <option value="Remote">Remote Only</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Gurugram">Gurugram</option>
              <option value="Noida">Noida</option>
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
              <option value="US">United States</option>
              <option value="Europe">Europe</option>
            </select>
          </div>

          {/* Experience Range Filter */}
          <div>
            <label className="text-text-muted font-medium block mb-1">Experience Range</label>
            <select
              value={filter.experienceRange || 'all'}
              onChange={(e) => onFilterChange({ ...filter, experienceRange: e.target.value, page: 1 })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-text-main focus:outline-none"
            >
              <option value="all">Any Experience</option>
              <option value="1-3">1–3 years</option>
              <option value="3-6">3–6 years (Fits 4.5 YOE ✓)</option>
              <option value="5-8">5–8 years</option>
              <option value="8+">8+ years</option>
            </select>
          </div>

          {/* Age Horizon Filter */}
          <div>
            <label className="text-text-muted font-medium block mb-1">Job Freshness</label>
            <select
              value={filter.ageHorizon || 'all'}
              onChange={(e) => onFilterChange({ ...filter, ageHorizon: e.target.value, page: 1 })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-text-main focus:outline-none"
            >
              <option value="all">Any Age</option>
              <option value="6h">Past 6 Hours</option>
              <option value="12h">Past 12 Hours</option>
              <option value="24h">Past 24 Hours</option>
              <option value="3d">Past 3 Days</option>
              <option value="7d">Past 7 Days</option>
              <option value="14d">Past 14 Days</option>
              <option value="30d">Past 30 Days</option>
            </select>
          </div>

          {/* Minimum Base Salary */}
          <div>
            <label className="text-text-muted font-medium block mb-1">Base Compensation</label>
            <select
              value={filter.minBaseSalary || ''}
              onChange={(e) => onFilterChange({ ...filter, minBaseSalary: e.target.value ? parseFloat(e.target.value) : undefined, page: 1 })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-text-main focus:outline-none"
            >
              <option value="">Any Compensation</option>
              <option value="2500000">₹25L+ Base</option>
              <option value="3500000">₹35L+ Base</option>
              <option value="4000000">₹40L+ Base (Target 🎯)</option>
              <option value="5000000">₹50L+ Base</option>
              <option value="100000">$100k+ USD (Remote)</option>
              <option value="150000">$150k+ USD (Remote)</option>
            </select>
          </div>

          {/* High-Compensation Opportunity Protection */}
          <div className="flex flex-col justify-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer bg-surface-elevated/60 border border-border p-2 rounded-lg hover:border-accent/40 transition-colors">
              <input
                type="checkbox"
                checked={filter.includeUndisclosedSalary !== false}
                onChange={(e) => onFilterChange({ ...filter, includeUndisclosedSalary: e.target.checked, page: 1 })}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
              />
              <div>
                <span className="text-text-main font-semibold block leading-tight">Protect Undisclosed</span>
                <span className="text-[10px] text-text-muted">Don't hide unstated salary</span>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
