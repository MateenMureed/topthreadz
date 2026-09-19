'use client';

import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { FiCheckCircle, FiChevronDown, FiLock, FiMinus, FiPlus } from 'react-icons/fi';

/* -------------------------------------------------------------------------- */
/*  Shared styles                                                             */
/*                                                                            */
/*  - text-base (16px) on every control: iOS Safari zooms the page on focus   */
/*    for anything smaller.                                                   */
/*  - 48px pill controls: compact, still above the 44px touch-target minimum. */
/*  - Labels are siblings of the control (peer) so they float with pure CSS.  */
/* -------------------------------------------------------------------------- */

const controlBase =
  'peer block w-full border bg-white text-base leading-6 text-surface-900 outline-none transition-colors duration-150 focus:ring-2 disabled:cursor-not-allowed disabled:bg-surface-200 disabled:text-surface-500 read-only:bg-surface-200 read-only:text-surface-700';

const controlState = (invalid: boolean) =>
  invalid
    ? 'border-primary focus:border-primary focus:ring-primary/20'
    : 'border-surface-300 hover:border-surface-400 focus:border-surface-900 focus:ring-surface-900/10';

const labelBase =
  'pointer-events-none absolute left-5 right-5 top-[5px] truncate text-[11px] font-medium leading-[14px] transition-all duration-150';

const labelColor = (invalid: boolean) =>
  invalid ? 'text-primary peer-focus:text-primary' : 'text-surface-500 peer-focus:text-surface-900';

// Label sits in the middle of the pill while empty + unfocused, then floats up.
const labelFloatInput =
  'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:leading-6 peer-focus:top-[5px] peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-medium peer-focus:leading-[14px]';

const labelFloatTextarea =
  'peer-placeholder-shown:top-[13px] peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:leading-6 peer-focus:top-[5px] peer-focus:text-[11px] peer-focus:font-medium peer-focus:leading-[14px]';

interface FieldMeta {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p id={`${id}-error`} role="alert" className="mt-1.5 px-4 text-xs leading-snug text-primary">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="mt-1.5 px-4 text-xs leading-snug text-surface-500">
        {hint}
      </p>
    );
  }
  return null;
}

const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

/* -------------------------------------------------------------------------- */
/*  TextField (pill)                                                          */
/* -------------------------------------------------------------------------- */

type TextFieldProps = FieldMeta & {
  /** Shows a lock icon; use together with readOnly. */
  locked?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className' | 'placeholder'>;

export function TextField({ id, label, error, hint, className = '', locked, ...props }: TextFieldProps) {
  const invalid = Boolean(error);
  return (
    <div className={className}>
      <div className="relative">
        <input
          id={id}
          {...props}
          placeholder=" "
          aria-invalid={invalid}
          aria-describedby={describedBy(id, error, hint)}
          className={`${controlBase} ${controlState(invalid)} h-12 rounded-full pb-1 pl-5 pt-[18px] ${
            locked ? 'pr-12' : 'pr-5'
          }`}
        />
        <label htmlFor={id} className={`${labelBase} ${labelColor(invalid)} ${labelFloatInput}`}>
          {label}
        </label>
        {locked ? (
          <FiLock
            aria-hidden="true"
            className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400"
          />
        ) : null}
      </div>
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  TextAreaField (street address)                                            */
/*  A multi-line box can't be a true pill, so it uses a large radius instead. */
/* -------------------------------------------------------------------------- */

type TextAreaFieldProps = FieldMeta &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className' | 'placeholder'>;

export function TextAreaField({ id, label, error, hint, className = '', rows = 2, ...props }: TextAreaFieldProps) {
  const invalid = Boolean(error);
  return (
    <div className={className}>
      <div className="relative">
        <textarea
          id={id}
          rows={rows}
          {...props}
          placeholder=" "
          aria-invalid={invalid}
          aria-describedby={describedBy(id, error, hint)}
          className={`${controlBase} ${controlState(invalid)} min-h-[84px] resize-none rounded-3xl px-5 pb-2 pt-[22px]`}
        />
        <label htmlFor={id} className={`${labelBase} ${labelColor(invalid)} ${labelFloatTextarea}`}>
          {label}
        </label>
      </div>
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  SelectField (pill)                                                        */
/*                                                                            */
/*  Native <select> on purpose: phones open the OS picker (best UX). The      */
/*  label is always floated because a select always shows some text.          */
/* -------------------------------------------------------------------------- */

type SelectFieldProps = FieldMeta & {
  placeholder: string;
  options: { value: string; label: string }[];
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className' | 'children'>;

export function SelectField({
  id,
  label,
  error,
  hint,
  className = '',
  placeholder,
  options,
  value,
  ...props
}: SelectFieldProps) {
  const invalid = Boolean(error);
  const hasValue = value !== undefined && value !== null && String(value) !== '';
  return (
    <div className={className}>
      <div className="relative">
        <select
          id={id}
          value={value}
          {...props}
          aria-invalid={invalid}
          aria-describedby={describedBy(id, error, hint)}
          className={`${controlBase} ${controlState(invalid)} h-12 cursor-pointer appearance-none truncate rounded-full pb-1 pl-5 pr-11 pt-[18px] ${
            hasValue ? 'text-surface-900' : 'text-surface-500'
          }`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="text-surface-900">
              {option.label}
            </option>
          ))}
        </select>
        <label htmlFor={id} className={`${labelBase} ${labelColor(invalid)}`}>
          {label}
        </label>
        <FiChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-500"
        />
      </div>
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  StepHeader: flat accordion row (navy bold title, +/– on the right)        */
/* -------------------------------------------------------------------------- */

interface StepHeaderProps {
  title: string;
  done: boolean;
  expanded: boolean;
  onToggle: () => void;
}

export function StepHeader({ title, done, expanded, onToggle }: StepHeaderProps) {
  const Icon = expanded ? FiMinus : FiPlus;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate font-display text-lg font-bold text-navy">{title}</span>
        {done ? (
          <>
            <FiCheckCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="sr-only">Completed</span>
          </>
        ) : null}
      </span>
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-navy" />
    </button>
  );
}
