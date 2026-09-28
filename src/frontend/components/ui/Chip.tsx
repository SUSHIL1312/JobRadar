import React from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  onRemove?: () => void;
  active?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  onRemove,
  active,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors select-none',
        active
          ? 'bg-accent/15 text-accent border-accent/30'
          : 'bg-surface-elevated text-text-secondary border-border hover:border-text-muted/30',
        className
      )}
      {...props}
    >
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:text-danger rounded-full p-0.5 focus:outline-none"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
