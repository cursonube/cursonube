import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'critical' | 'plain';

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-[var(--p-radius-md)] px-3 py-1.5 text-[13px] font-[550] transition disabled:cursor-not-allowed disabled:opacity-50';

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-[var(--p-color-action-primary)] text-[var(--p-color-on-action-primary)] shadow-[var(--p-shadow-button-primary)] hover:bg-[var(--p-color-action-primary-hover)]',
  secondary:
    'bg-[var(--p-color-surface)] text-[var(--p-color-text)] border border-[var(--p-color-border)] shadow-[var(--p-shadow-button)] hover:bg-[var(--p-color-surface-hover)]',
  critical:
    'bg-[var(--p-color-surface)] text-[var(--p-color-critical-secondary)] border border-[var(--p-color-critical-border)] hover:bg-[var(--p-color-critical-bg)]',
  plain:
    'text-[var(--p-color-text-secondary)] hover:text-[var(--p-color-text)]',
};

/** Para elementos no-<button> (ej. Link) que necesitan el mismo look — evita duplicar las clases. */
export function buttonClassName(variant: Variant = 'secondary', className = '') {
  return `${BASE} ${VARIANT[variant]} ${className}`;
}

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={buttonClassName(variant, className)} {...props} />;
}
