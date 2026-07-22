import type { SelectHTMLAttributes } from 'react';

export function Select({
  className = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`rounded-[var(--p-radius-md)] border border-[var(--p-color-border)] bg-[var(--p-color-surface)] px-3 py-1.5 text-[13px] text-[var(--p-color-text)] outline-none transition focus:border-[var(--p-color-border-focus)] focus:ring-1 focus:ring-[var(--p-color-border-focus)] ${className}`}
      {...props}
    />
  );
}
