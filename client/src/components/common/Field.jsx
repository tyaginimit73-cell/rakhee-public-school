import { useId, useRef, cloneElement, isValidElement, forwardRef } from 'react';
import { cx } from '../../utils/format.js';

// Accessible form primitives (work standalone or with react-hook-form register())
// The label and its control are linked via htmlFor/id (generated with
// useId() unless the child already sets its own id), and validation
// errors are linked to the control via aria-describedby + aria-invalid —
// previously the <label> and the input were only visually adjacent, with
// no programmatic association a screen reader could rely on.
export function Field({ label, error, required, children, hint, className = '', id }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const errorId = `${fieldId}-error`;
  const child = isValidElement(children)
    ? cloneElement(children, {
      id: children.props.id || fieldId,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? errorId : children.props['aria-describedby'],
    })
    : children;

  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={fieldId}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {child}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="form-error" id={errorId} role="alert">{error}</p>}
    </div>
  );
}

export const Input = forwardRef(function Input({ className = '', ...props }, ref) {
  return <input ref={ref} className={cx('input', className)} {...props} />;
});

export function Select({ className = '', children, ...props }) {
  return <select className={cx('input', className)} {...props}>{children}</select>;
}

export function Textarea({ className = '', rows = 4, ...props }) {
  return <textarea rows={rows} className={cx('input resize-y', className)} {...props} />;
}

export function FileInput({ label = 'Choose file', file, className = '', id, ...props }) {
  const boxClass = cx('flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-line/20 px-4 py-6 text-sm font-medium text-muted transition hover:border-brand-500 hover:text-brand-600 focus-within:ring-4 focus-within:ring-brand-500/30', className);
  // `hidden` (display:none) removes an element from the tab order
  // entirely — the file input was previously unreachable by keyboard no
  // matter which variant below renders. `sr-only` (a standard Tailwind
  // utility) hides it visually while keeping it focusable, so Tab still
  // reaches it and the dashed box shows a focus ring via :focus-within.
  const inputClass = 'sr-only';
  const content = <span className="truncate">{file ? file.name : label}</span>;

  // Field always injects an id when it wraps a child (see Field's
  // cloneElement above) — when one is present here, an outer <label
  // htmlFor> already exists and already provides the accessible name and
  // click-to-focus association. Wrapping in a SECOND, internal <label> in
  // that case means two separate <label> elements both claiming to label
  // one <input>, which is invalid/confusing for assistive tech — not
  // literal DOM nesting, but the same underlying problem. So: a plain,
  // identically-styled div instead, with the click-to-open behavior
  // reimplemented via a ref (a plain div has no native label-click
  // behavior to rely on).
  if (id) {
    return <FileInputBox id={id} boxClass={boxClass} inputClass={inputClass} content={content} {...props} />;
  }

  // Standalone usage (no wrapping Field) — self-contained: the native
  // <label> wrapping the input is both the click target and the sole
  // accessible name, with no external label to conflict with.
  return (
    <label className={boxClass}>
      <input type="file" className={inputClass} {...props} />
      {content}
    </label>
  );
}

function FileInputBox({ id, boxClass, inputClass, content, ...props }) {
  const inputRef = useRef(null);
  return (
    <div className={boxClass} onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" id={id} className={inputClass} {...props} />
      {content}
    </div>
  );
}
