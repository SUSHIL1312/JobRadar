// Deterministic Job Matching Engine

import { NormalizedJob, JobSearchProfile, MatchResult, Seniority, ExperienceCompatibility } from '../../types';
import { extractSkills, canonicalizeSkill } from '../normalization/skills';
import { APP_CONFIG } from '../../config';

// 30 Target Companies Universe Sets
const TIER_1_COMPANIES = new Set([
  'nvidia', 'google', 'microsoft', 'meta', 'apple', 'amazon',
  'atlassian', 'uber', 'linkedin', 'adobe', 'salesforce',
  'rubrik', 'databricks', 'cloudflare', 'qualcomm', 'amd',
  'de shaw', 'confluent',
]);

const TIER_2_COMPANIES = new Set([
  'stripe', 'rippling', 'airbnb', 'coinbase', 'servicenow',
  'walmart', 'walmart global tech', 'intel', 'arm',
  'bloomberg', 'palantir', 'snowflake', 'jane street',
]);

export function calculateMatchScore(
  job: NormalizedJob,
  profile: JobSearchProfile,
  customWeights?: {
    title: number;
    skills: number;
    seniority: number;
    experience: number;
    location: number;
  }
): MatchResult {
  const weights = customWeights || APP_CONFIG.matching.weights;
  const nowIso = new Date().toISOString();

  // 0. Check exclusions first (Hard disqualifiers)
  const jobTitleLower = job.title.toLowerCase();
  const companyLower = job.company.toLowerCase();
  const fullTextLower = `${job.title} ${job.description || ''}`.toLowerCase();

  // Check excluded companies
  const isExcludedCompany = (profile.excludedCompanies || []).some(
    exc => exc.toLowerCase() === companyLower || companyLower.includes(exc.toLowerCase())
  );
  if (isExcludedCompany) {
    return createDisqualifiedResult('Excluded company', 'excluded', nowIso);
  }

  // Check excluded keywords
  const matchedExcludedKeyword = (profile.excludedKeywords || []).find(
    kw => fullTextLower.includes(kw.toLowerCase())
  );
  if (matchedExcludedKeyword) {
    return createDisqualifiedResult(`Excluded keyword: "${matchedExcludedKeyword}"`, 'neutral', nowIso);
  }

  // 1. Title Compatibility Score (0 - 100)
  let titleScore = 20; // baseline if vaguely tech
  let titleMatchCategory: 'strong' | 'good' | 'moderate' | 'weak' = 'weak';

  for (const targetTitle of profile.jobTitles) {
    const target = targetTitle.toLowerCase();
    if (jobTitleLower === target) {
      titleScore = 100;
      titleMatchCategory = 'strong';
      break;
    }

    // Check if all words from target title are in job title
    const targetWords = target.split(/\s+/).filter(w => w.length > 2);
    const matchedWords = targetWords.filter(w => jobTitleLower.includes(w));
    const ratio = matchedWords.length / targetWords.length;

    if (ratio >= 0.8) {
      titleScore = Math.max(titleScore, 90);
      titleMatchCategory = 'strong';
    } else if (ratio >= 0.5) {
      titleScore = Math.max(titleScore, 75);
      if (titleMatchCategory !== 'strong') titleMatchCategory = 'good';
    } else if (ratio > 0) {
      titleScore = Math.max(titleScore, 50);
      if (titleMatchCategory === 'weak') titleMatchCategory = 'moderate';
    }
  }

  // 2. Skills Coverage Score (0 - 100)
  const userProfileSkills = (profile.skills || []).map(s => canonicalizeSkill(s));
  const detectedJobSkills = extractSkills(
    `${job.title} ${job.description || ''}`,
    userProfileSkills
  );

  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of userProfileSkills) {
    if (detectedJobSkills.includes(skill)) {
      matchingSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const skillCoverageRatio = userProfileSkills.length > 0
    ? matchingSkills.length / Math.min(userProfileSkills.length, 8) // evaluate against top 8 skills
    : 1;
  const skillScore = Math.min(100, Math.round(skillCoverageRatio * 100));

  // 3. Seniority Compatibility Score (0 - 100)
  let seniorityScore = 70; // neutral default if unknown
  let seniorityMatch = false;

  const targetSeniorities: Seniority[] = profile.seniorityLevels && profile.seniorityLevels.length > 0
    ? profile.seniorityLevels
    : ['mid', 'senior', 'lead', 'staff'];

  if (job.seniority !== 'unknown') {
    if (targetSeniorities.includes(job.seniority)) {
      seniorityScore = 100;
      seniorityMatch = true;
    } else {
      // Adjacent penalty
      seniorityScore = 35;
      seniorityMatch = false;
    }
  } else {
    // If unknown, assume neutral
    seniorityScore = 75;
    seniorityMatch = true;
  }

  // 4. Experience Compatibility Score & Badge Categorization
  let experienceScore = 80;
  let experienceMatch = true;
  let minReqYears = job.minExperienceYears;
  let maxReqYears = job.maxExperienceYears;
  let experienceText = job.experienceText;

  if (minReqYears === undefined) {
    const expMatch = (job.description || '').match(/\b(\d+)\+?\s*(?:to\s*(\d+))?\s*(?:years|yrs)\b/i);
    if (expMatch) {
      minReqYears = parseInt(expMatch[1], 10);
      maxReqYears = expMatch[2] ? parseInt(expMatch[2], 10) : minReqYears + 3;
      experienceText = `${minReqYears}${expMatch[2] ? `–${maxReqYears}` : '+'} years`;
    }
  }

  const userYears = profile.yearsOfExperience || 4.5;
  let expCompatibility: ExperienceCompatibility;

  if (minReqYears !== undefined) {
    const reqLabel = experienceText || (maxReqYears ? `${minReqYears}–${maxReqYears} yrs` : `${minReqYears}+ yrs`);
    if (minReqYears <= 5) {
      // 4.5 YOE comfortably meets requirements <= 5 years
      experienceScore = 100;
      experienceMatch = true;
      expCompatibility = {
        status: 'compatible',
        label: `✓ Compatible (${reqLabel})`,
        requiredText: reqLabel,
        minYears: minReqYears,
        maxYears: maxReqYears,
      };
    } else {
      // 6+ years required is a reach/stretch opportunity - flag it, DO NOT hide it
      const diff = minReqYears - userYears;
      experienceScore = Math.max(30, Math.round(90 - diff * 15));
      experienceMatch = false;
      expCompatibility = {
        status: 'reach',
        label: `⚠ Reach (${reqLabel})`,
        requiredText: reqLabel,
        minYears: minReqYears,
        maxYears: maxReqYears,
      };
    }
  } else {
    expCompatibility = {
      status: 'unspecified',
      label: 'ℹ Exp: Not specified',
      requiredText: 'Not specified',
    };
  }

  // 5. Location & Remote Compatibility Score (0 - 100)
  let locationScore = 50;
  let locationMatchCat: 'exact' | 'remote_aligned' | 'acceptable' | 'unaligned' = 'acceptable';

  const isRemote = job.remoteType === 'remote';
  const isHybrid = job.remoteType === 'hybrid';
  const targetLocationsLower = (profile.locations || []).map(l => l.toLowerCase());
  const jobLocationsLower = (job.location || []).map(l => l.toLowerCase());

  const hasLocationOverlap = jobLocationsLower.some(jl =>
    targetLocationsLower.some(tl => jl.includes(tl) || tl.includes(jl))
  );

  if (profile.remotePreference === 'remote_only') {
    if (isRemote) {
      locationScore = 100;
      locationMatchCat = 'remote_aligned';
    } else {
      locationScore = 10;
      locationMatchCat = 'unaligned';
    }
  } else if (profile.remotePreference === 'remote_preferred') {
    if (isRemote) {
      locationScore = 100;
      locationMatchCat = 'remote_aligned';
    } else if (hasLocationOverlap) {
      locationScore = isHybrid ? 85 : 75;
      locationMatchCat = 'exact';
    } else {
      locationScore = 30;
      locationMatchCat = 'unaligned';
    }
  } else {
    // hybrid_ok or any
    if (hasLocationOverlap || isRemote) {
      locationScore = 100;
      locationMatchCat = isRemote ? 'remote_aligned' : 'exact';
    } else {
      locationScore = 40;
      locationMatchCat = 'acceptable';
    }
  }

  // First-Class Remote Priority Multiplier (Highest / High / Normal / Low)
  if (isRemote && (profile.remotePriority === 'highest' || profile.remotePriority === 'high')) {
    locationScore = Math.min(100, locationScore + 10);
  }

  // Check company preference boost & 30 Target Universe Priority Tiers
  const isTier1 = TIER_1_COMPANIES.has(companyLower) || Array.from(TIER_1_COMPANIES).some(c => companyLower.includes(c));
  const isTier2 = TIER_2_COMPANIES.has(companyLower) || Array.from(TIER_2_COMPANIES).some(c => companyLower.includes(c));
  const isPreferredCompany = isTier1 || isTier2 || (profile.preferredCompanies || []).some(
    p => p.toLowerCase() === companyLower || companyLower.includes(p.toLowerCase())
  );

  let tierBonus = 0;
  if (isTier1) {
    tierBonus = 15; // 🔥🔥🔥 Tier 1 Must-Check Bonus
  } else if (isTier2) {
    tierBonus = 8; // 🔥🔥 Tier 2 High-Value Bonus
  } else if (isPreferredCompany) {
    tierBonus = APP_CONFIG.matching.preferredCompanyBonus || 10;
  }

  // Weighted sum
  const weightedSum =
    (titleScore * weights.title +
      skillScore * weights.skills +
      seniorityScore * weights.seniority +
      experienceScore * weights.experience +
      locationScore * weights.location) / 100;

  const overallScore = Math.min(100, Math.max(0, Math.round(weightedSum + tierBonus)));

  // Build summary message
  let summary = `${overallScore}% Profile Compatibility. `;
  if (matchingSkills.length > 0) {
    summary += `Matches ${matchingSkills.length} key skills (${matchingSkills.slice(0, 3).join(', ')}). `;
  }
  if (isRemote) {
    summary += 'Fully remote opportunity. ';
  }
  if (isTier1) {
    summary += `${job.company} is a Tier 1 (Must-Check) target company.`;
  } else if (isTier2) {
    summary += `${job.company} is a Tier 2 (High-Value) target company.`;
  } else if (isPreferredCompany) {
    summary += `${job.company} is in your preferred companies.`;
  }

  return {
    overallScore,
    titleScore,
    skillScore,
    seniorityScore,
    experienceScore,
    locationScore,
    matchingSkills,
    missingSkills: missingSkills.slice(0, 5),
    experienceCompatibility: expCompatibility,
    explanation: {
      titleMatch: titleMatchCategory,
      skillsCoverage: Math.round(skillCoverageRatio * 100),
      seniorityMatch,
      experienceMatch,
      locationMatch: locationMatchCat,
      companyStatus: isPreferredCompany ? 'preferred' : 'neutral',
      summary: summary.trim(),
    },
    calculatedAt: nowIso,
  };
}

function createDisqualifiedResult(
  reason: string,
  companyStatus: 'preferred' | 'neutral' | 'excluded',
  nowIso: string
): MatchResult {
  return {
    overallScore: 0,
    titleScore: 0,
    skillScore: 0,
    seniorityScore: 0,
    experienceScore: 0,
    locationScore: 0,
    matchingSkills: [],
    missingSkills: [],
    explanation: {
      titleMatch: 'weak',
      skillsCoverage: 0,
      seniorityMatch: false,
      experienceMatch: false,
      locationMatch: 'unaligned',
      companyStatus,
      summary: `Disqualified by rule: ${reason}`,
    },
    calculatedAt: nowIso,
  };
}
