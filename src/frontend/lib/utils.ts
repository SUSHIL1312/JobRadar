import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(min?: number, max?: number, currency: string = 'INR'): string {
  if (!min && !max) return 'Salary undisclosed';

  const formatNum = (val: number) => {
    if (currency === 'INR') {
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
      if (val >= 100000) return `₹${(val / 100000).toFixed(1)} LPA`;
      return `₹${val.toLocaleString('en-IN')}`;
    }
    if (val >= 1000) return `$${Math.round(val / 1000)}k`;
    return `$${val.toLocaleString()}`;
  };

  if (min && max) {
    return `${formatNum(min)} – ${formatNum(max)}`;
  }
  if (min) return `From ${formatNum(min)}`;
  if (max) return `Up to ${formatNum(max)}`;
  return 'Salary undisclosed';
}
