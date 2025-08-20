import React, { useId, forwardRef } from 'react';

type BaseProps = {
  id?: string;
  label: string;
  helperText?: string;
  error?: string | boolean;
  className?: string;
};

type InputProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement> & {
  as?: 'input';
};

type TextareaProps = BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  as: 'textarea';
};

export type InputPanelProps = InputProps | TextareaProps;

/** Floating label input panel matching the UI kit */
export const InputPanel = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputPanelProps>(
  function InputPanel(props, ref) {
    const autoId = useId();
    const { id = autoId, label, helperText, error, className = '', as = 'input', ...rest } = props as any;
    const describedById = helperText ? `${id}-desc` : undefined;
    const invalid = Boolean(error);

    return (
      <div className={`input-panel ${className}`}>
        <label className="input-panel-label" htmlFor={id}>
          {label}
        </label>
        {as === 'textarea' ? (
          <textarea
            id={id}
            className="form-element"
            aria-invalid={invalid || undefined}
            aria-describedby={describedById}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            id={id}
            className="form-element"
            aria-invalid={invalid || undefined}
            aria-describedby={describedById}
            ref={ref as React.Ref<HTMLInputElement>}
            {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        {helperText && (
          <p id={describedById} className="mt-2 text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
            {helperText}
          </p>
        )}
        {typeof error === 'string' && error && (
          <p className="mt-1 text-xs font-mono" style={{ color: 'crimson' }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

export default InputPanel;
