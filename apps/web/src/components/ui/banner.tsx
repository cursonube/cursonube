import type { HTMLAttributes } from 'react';

type Tone = 'critical' | 'warning' | 'success' | 'info';

const TONE: Record<Tone, string> = {
  critical:
    'bg-[var(--p-color-critical-bg)] text-[var(--p-color-critical)] border-[var(--p-color-critical-border)]',
  warning:
    'bg-[var(--p-color-warning-bg)] text-[var(--p-color-warning)] border-[var(--p-color-warning-border)]',
  success:
    'bg-[var(--p-color-success-bg)] text-[var(--p-color-success)] border-[var(--p-color-success-border)]',
  info: 'bg-[var(--p-color-info-bg)] text-[var(--p-color-info)] border-[var(--p-color-info-border)]',
};

export function Banner({
  tone = 'critical',
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  return (
    <div
      className={`rounded-[var(--p-radius-md)] border px-3 py-2 text-[13px] ${TONE[tone]} ${className}`}
      {...props}
    />
  );
}
