// Job Sources Registry

import { JobSource } from '../../types';
import { MockJobSource } from './mockSource';
import { GreenhouseAdapter } from './greenhouseAdapter';
import { LeverAdapter } from './leverAdapter';
import { RemotiveAdapter } from './remotiveAdapter';

export const ALL_JOB_SOURCES: JobSource[] = [
  new MockJobSource(),
  new GreenhouseAdapter(),
  new LeverAdapter(),
  new RemotiveAdapter(),
];

export function getSourceById(id: string): JobSource | undefined {
  return ALL_JOB_SOURCES.find(s => s.id === id);
}

export function getEnabledSources(enabledIds?: string[], mockOnly: boolean = false): JobSource[] {
  if (mockOnly) {
    return ALL_JOB_SOURCES.filter(s => s.type === 'mock');
  }

  if (!enabledIds || enabledIds.length === 0) {
    return ALL_JOB_SOURCES.filter(s => s.enabled);
  }

  const enabledSet = new Set(enabledIds);
  return ALL_JOB_SOURCES.filter(s => enabledSet.has(s.id));
}
