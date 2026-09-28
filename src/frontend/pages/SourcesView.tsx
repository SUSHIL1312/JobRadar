import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Radio,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Building2,
  ExternalLink,
  Flame,
  Sparkles,
  Globe,
  Search,
  Filter,
  ArrowUpRight,
} from 'lucide-react';
import { Company } from '../../types';

interface RemoteBoard {
  name: string;
  url: string;
  category: string;
  description: string;
  tags: string[];
  status: 'active' | 'integrated' | 'catalog';
}

const TIER_3_REMOTE_BOARDS: RemoteBoard[] = [
  {
    name: 'Remotive',
    url: 'https://remotive.com',
    category: 'Remote Tech API',
    description: 'Vetted remote software engineering, AI, and systems roles worldwide.',
    tags: ['Active API Adapter', 'Live Ingestion', 'Worldwide'],
    status: 'integrated',
  },
  {
    name: 'RemoteOK',
    url: 'https://remoteok.com',
    category: 'Global Remote Feed',
    description: 'High-traffic remote board featuring verified tech roles with direct apply URLs.',
    tags: ['Active API Adapter', 'Live Ingestion', 'Global'],
    status: 'integrated',
  },
  {
    name: 'Wellfound (AngelList)',
    url: 'https://wellfound.com/jobs',
    category: 'Startup & Scaleup',
    description: 'Premier hub for venture-backed AI/ML, systems, and unicorn startups.',
    tags: ['High Growth', 'Equity Transparent', 'Global'],
    status: 'integrated',
  },
  {
    name: 'We Work Remotely',
    url: 'https://weworkremotely.com',
    category: 'Global Remote Community',
    description: 'The largest remote work community with dedicated backend and programming tracks.',
    tags: ['Remote First', 'RSS Feed', 'Worldwide'],
    status: 'active',
  },
  {
    name: 'Himalayas',
    url: 'https://himalayas.app/jobs',
    category: 'Modern Remote Platform',
    description: 'Verified remote roles with comprehensive salary and tech stack disclosures.',
    tags: ['Transparent Comp', 'Tech Stack Filters', 'Remote'],
    status: 'active',
  },
  {
    name: 'Working Nomads',
    url: 'https://www.workingnomads.com/jobs',
    category: 'Curated Tech Roles',
    description: 'Curated list of 100% remote development and engineering opportunities.',
    tags: ['Curated', 'Software Dev', 'Global'],
    status: 'active',
  },
  {
    name: 'Arc.dev',
    url: 'https://arc.dev',
    category: 'Vetted Senior Engineers',
    description: 'Platform connecting pre-vetted senior engineers with high-paying global remote teams.',
    tags: ['Senior Tech', 'High Comp', 'Remote Global'],
    status: 'active',
  },
  {
    name: 'Dynamite Jobs',
    url: 'https://dynamitejobs.com',
    category: 'Remote Opportunities',
    description: 'High-quality remote roles across distributed engineering and product organizations.',
    tags: ['Remote Only', 'Verified Companies'],
    status: 'active',
  },
];

export const SourcesView: React.FC = () => {
  const [sources, setSources] = useState<any[]>([]);
  const [targetCompanies, setTargetCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'universe' | 'adapters' | 'remote_boards'>('universe');
  const [selectedTier, setSelectedTier] = useState<'all' | 'tier_1' | 'tier_2'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getSources();
      setSources(data.sources || []);
      setTargetCompanies(data.targetCompanies || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    return targetCompanies.filter((comp) => {
      // Tier filter
      if (selectedTier !== 'all' && comp.tier !== selectedTier) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = comp.name.toLowerCase().includes(query);
        const matchesDomain = comp.domain?.toLowerCase().includes(query) ?? false;
        const matchesRoles = comp.targetRoles?.toLowerCase().includes(query) ?? false;
        const matchesATS = comp.atsType?.toLowerCase().includes(query) ?? false;
        return matchesName || matchesDomain || matchesRoles || matchesATS;
      }
      return true;
    });
  }, [targetCompanies, selectedTier, searchQuery]);

  const tier1Count = useMemo(() => targetCompanies.filter((c) => c.tier === 'tier_1').length, [targetCompanies]);
  const tier2Count = useMemo(() => targetCompanies.filter((c) => c.tier === 'tier_2').length, [targetCompanies]);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in max-w-7xl mx-auto">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-text-main tracking-tight flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-accent" />
            Sources & Company Universe
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Tailored for 4.5 YOE Samsung SDE (IIT Guwahati M.Tech) • Monitoring 30 Premier Target Companies & Remote Boards
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-elevated/70 border border-border rounded-xl">
          <button
            onClick={() => setActiveTab('universe')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'universe'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-main hover:bg-surface'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Target Universe ({targetCompanies.length || 30})
          </button>
          <button
            onClick={() => setActiveTab('adapters')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'adapters'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-main hover:bg-surface'
            }`}
          >
            <Zap className="w-4 h-4" />
            Adapters ({sources.length})
          </button>
          <button
            onClick={() => setActiveTab('remote_boards')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'remote_boards'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-main hover:bg-surface'
            }`}
          >
            <Globe className="w-4 h-4" />
            Tier 3 Remote ({TIER_3_REMOTE_BOARDS.length})
          </button>
        </div>
      </div>

      {/* TAB 1: TARGET COMPANIES UNIVERSE */}
      {activeTab === 'universe' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between">
              <div>
                <div className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-accent" />
                  Total Monitored Universe
                </div>
                <div className="text-2xl font-black text-text-main mt-1">
                  {targetCompanies.length} <span className="text-xs font-normal text-text-secondary">Companies</span>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/25">
                100% Active
              </span>
            </div>

            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 flex items-center justify-between">
              <div>
                <div className="text-xs text-orange-400 font-medium flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20" />
                  Tier 1 — Must Check
                </div>
                <div className="text-2xl font-black text-text-main mt-1">
                  {tier1Count} <span className="text-xs font-normal text-orange-400/80">Priority Targets</span>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                +15 Score
              </span>
            </div>

            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-between">
              <div>
                <div className="text-xs text-purple-400 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Tier 2 — High Value
                </div>
                <div className="text-2xl font-black text-text-main mt-1">
                  {tier2Count} <span className="text-xs font-normal text-purple-400/80">Top Product Teams</span>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                +8 Score
              </span>
            </div>
          </div>

          {/* Filtering & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-surface border border-border rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-muted flex items-center gap-1 px-1">
                <Filter className="w-3.5 h-3.5" /> Tier:
              </span>
              <button
                onClick={() => setSelectedTier('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  selectedTier === 'all'
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'text-text-secondary hover:text-text-main hover:bg-surface-elevated'
                }`}
              >
                All ({targetCompanies.length})
              </button>
              <button
                onClick={() => setSelectedTier('tier_1')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                  selectedTier === 'tier_1'
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                    : 'text-text-secondary hover:text-text-main hover:bg-surface-elevated'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                Tier 1 ({tier1Count})
              </button>
              <button
                onClick={() => setSelectedTier('tier_2')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                  selectedTier === 'tier_2'
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                    : 'text-text-secondary hover:text-text-main hover:bg-surface-elevated'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Tier 2 ({tier2Count})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search company, role, or ATS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-elevated border border-border rounded-lg text-text-main placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Companies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((comp) => {
              const isTier1 = comp.tier === 'tier_1';
              const targetRolesList = comp.targetRoles ? comp.targetRoles.split(',').map((r) => r.trim()) : [];

              return (
                <Card
                  key={comp.id}
                  className="p-5 bg-surface border-border hover:border-accent/40 transition-all space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: Name, Tier, Career Link */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-text-main hover:text-accent transition-colors">
                            {comp.name}
                          </h3>
                          {comp.careerUrl && (
                            <a
                              href={comp.careerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-text-muted hover:text-accent transition-colors"
                              title={`Open ${comp.name} Careers`}
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        <div className="text-xs text-text-muted mt-0.5">{comp.domain}</div>
                      </div>

                      {/* Tier Badge */}
                      {isTier1 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 whitespace-nowrap">
                          <Flame className="w-3 h-3 text-orange-500 fill-orange-500" /> Tier 1
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 whitespace-nowrap">
                          <Sparkles className="w-3 h-3 text-purple-400" /> Tier 2
                        </span>
                      )}
                    </div>

                    {/* Metadata Badges: Priority, Remote, ATS */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent font-medium border border-accent/20">
                        ✓ Preferred
                      </span>

                      {comp.remoteEligible && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Remote-Friendly
                        </span>
                      )}

                      {comp.atsType && (
                        <span className="px-2 py-0.5 rounded-md bg-surface-elevated text-text-muted font-mono uppercase text-[10px] border border-border">
                          ATS: {comp.atsType}
                        </span>
                      )}
                    </div>

                    {/* Target Roles & Tech Stack */}
                    {targetRolesList.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-medium text-text-muted">Target Roles & Tech:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {targetRolesList.map((role, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-surface-elevated text-text-secondary border border-border-subtle"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
                    <span className="text-[11px] text-text-muted font-mono">
                      Bonus: {isTier1 ? '+15 pts' : '+8 pts'}
                    </span>
                    {comp.careerUrl && (
                      <a
                        href={comp.careerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
                      >
                        Careers Portal <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredCompanies.length === 0 && (
            <div className="p-12 text-center bg-surface border border-border rounded-xl">
              <Building2 className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-text-main">No companies found</p>
              <p className="text-xs text-text-muted mt-1">Try relaxing your search query or tier filter.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE DISCOVERY ADAPTERS */}
      {activeTab === 'adapters' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              Configured Automated Search Adapters
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              These engines poll official public APIs and ATS platforms on schedule, deduplicating and indexing jobs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map((src) => (
              <Card key={src.id} className="p-5 bg-surface border-border space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-text-main">{src.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-text-muted uppercase">
                        {src.type}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      Source ID: <span className="font-mono text-text-secondary">{src.id}</span> • Priority:{' '}
                      <span className="capitalize">{src.priority}</span>
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
      )}

      {/* TAB 3: TIER 3 REMOTE BOARDS DIRECTORY */}
      {activeTab === 'remote_boards' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
              <Globe className="w-5 h-5 text-accent" />
              Tier 3 — Remote Job Boards & High-Value Portals
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Curated global remote platforms providing worldwide engineering roles, transparent tech stacks, and US/Global compensation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TIER_3_REMOTE_BOARDS.map((board, idx) => (
              <Card key={idx} className="p-5 bg-surface border-border hover:border-accent/40 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-base text-text-main flex items-center gap-1.5">
                        {board.name}
                      </h4>
                      <span className="text-[11px] text-text-muted">{board.category}</span>
                    </div>

                    {board.status === 'integrated' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                        Integrated
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted border border-border">
                        Monitored
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed">{board.description}</p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {board.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-surface-elevated text-text-muted border border-border-subtle"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
                  <span className="text-[11px] text-text-muted">Direct Portal</span>
                  <a
                    href={board.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                  >
                    Open {board.name} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
