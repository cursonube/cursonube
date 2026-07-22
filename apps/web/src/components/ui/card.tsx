import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[var(--p-radius-lg)] border border-[var(--p-color-border)] bg-[var(--p-color-surface)] shadow-[var(--p-shadow-card)] ${className}`}
      {...props}
    />
  );
}
