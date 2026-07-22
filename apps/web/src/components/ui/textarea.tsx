import type { TextareaHTMLAttributes } from 'react';

const TEXTAREA_CLASS =
  'w-full rounded-[var(--p-radius-md)] border border-[var(--p-color-border)] bg-[var(--p-color-surface)] px-3 py-1.5 text-[13px] text-[var(--p-color-text)] outline-none transition placeholder:text-[var(--p-color-text-disabled)] focus:border-[var(--p-color-border-focus)] focus:ring-1 focus:ring-[var(--p-color-border-focus)]';

export function Textarea({
  label,
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const field = <textarea className={`${TEXTAREA_CLASS} ${className}`} {...props} />;

  if (!label) return field;

  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-[550] text-[var(--p-color-text)]">
        {label}
      </span>
      {field}
    </label>
  );
}
