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
    { label: 'All Jobs', state: { status: 'ALL', ageHorizon: 'all', minScore: undefined } },
    { label: 'Fresh (<24h)', state: { ageHorizon: '24h', minScore: undefined } },
    { label: 'High Match (≥80%)', state: { minScore: 80 } },
    { label: 'Remote Only', state: { remote: 'remote' as RemoteType } },
    { label: 'Selected', state: { status: 'SELECTED' as JobStatus } },
    { label: 'Applied', state: { status: 'APPLIED' as JobStatus } },
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
        <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in text-xs">
          {/* Status Filter */}
          <div>
            <label className="text-text-muted font-medium block mb-1">Status</label>
            <select
              value={filter.status || 'ALL'}
              onChange={(e) => onFilterChange({ ...filter, status: e.target.value as any, page: 1 })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-text-main focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="SAVED">Saved</option>
              <option value="SELECTED">Selected</option>
              <option value="APPLIED">Applied</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFER">Offer</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Age Horizon Filter */}
          <div>
            <label className="text-text-muted font-medium block mb-1">Job Age</label>
            <select
              value={filter.ageHorizon || 'all'}
              onChange={(e) => onFilterChange({ ...filter, ageHorizon: e.target.value, page: 1 })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-text-main focus:outline-none"
            >
              <option value="all">Any Age</option>
              <option value="6h">Past 6 Hours</option>
              <option value="12h">Past 12 Hours</option>
              <option value="24h">Past 24 Hours</option>
              <option value="2d">Past 2 Days</option>
              <option value="3d">Past 3 Days</option>
              <option value="7d">Past 7 Days</option>
              <option value="14d">Past 14 Days</option>
              <option value="30d">Past 30 Days</option>
            </select>
          </div>

          {/* Remote Filter */}
          <div>
            <label className="text-text-muted font-medium block mb-1">Remote Preference</label>
            <select
              value={filter.remote || 'ALL'}
              onChange={(e) => onFilterChange({ ...filter, remote: e.target.value as any, page: 1 })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-text-main focus:outline-none"
            >
              <option value="ALL">All Workplaces</option>
              <option value="remote">Remote Only</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </div>

          {/* Seniority Filter */}
          <div>
            <label className="text-text-muted font-medium block mb-1">Seniority Level</label>
            <select
              value={filter.seniority || 'ALL'}
              onChange={(e) => onFilterChange({ ...filter, seniority: e.target.value as any, page: 1 })}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-text-main focus:outline-none"
            >
              <option value="ALL">All Seniorities</option>
              <option value="junior">Junior / Associate</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead / Architect</option>
              <option value="staff">Staff / Principal</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
