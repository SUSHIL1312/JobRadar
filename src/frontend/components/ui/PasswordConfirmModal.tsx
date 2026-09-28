import React, { useState } from 'react';
import { Button } from './Button';
import { ShieldAlert, X, Lock } from 'lucide-react';

interface PasswordConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmButtonText?: string;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}

export const PasswordConfirmModal: React.FC<PasswordConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmButtonText = 'Confirm Clear',
  onClose,
  onConfirm,
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Password or confirmation phrase is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm(password.trim());
      setPassword('');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-surface border border-danger/30 rounded-2xl shadow-2xl p-6 z-10 animate-slide-up space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 text-danger font-bold text-base">
            <div className="w-9 h-9 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-danger" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-main">{title}</h3>
              <p className="text-[11px] text-danger font-normal">Destructive action confirmation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-text-secondary leading-relaxed bg-surface-elevated/40 p-3 rounded-xl border border-border">
          {description}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-main block mb-1">
              Enter password (or "RESET" to confirm)
            </label>
            <div className="relative">
              <input
                type="password"
                autoFocus
                placeholder="Password or type RESET"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
                className="w-full bg-surface-elevated border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-danger/40"
              />
              <Lock className="w-4 h-4 text-text-muted absolute left-2.5 top-2.5" />
            </div>
            {error && (
              <p className="text-[11px] text-danger mt-1.5 font-medium animate-fade-in">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              loading={loading}
            >
              {confirmButtonText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
