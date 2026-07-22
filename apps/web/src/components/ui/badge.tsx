import type { HTMLAttributes } from 'react';

type Tone = 'success' | 'warning' | 'critical' | 'info' | 'neutral';

const TONE: Record<Tone, string> = {
  success:
    'bg-[var(--p-color-success-bg)] text-[var(--p-color-success)]',
  warning:
    'bg-[var(--p-color-warning-bg)] text-[var(--p-color-warning)]',
  critical:
    'bg-[var(--p-color-critical-bg)] text-[var(--p-color-critical)]',
  info: 'bg-[var(--p-color-info-bg)] text-[var(--p-color-info)]',
  neutral:
    'bg-[var(--p-color-surface-secondary)] text-[var(--p-color-text-secondary)]',
};

export function Badge({
  tone = 'neutral',
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--p-radius-full)] px-2.5 py-0.5 text-[12px] font-[550] ${TONE[tone]} ${className}`}
      {...props}
    />
  );
}
