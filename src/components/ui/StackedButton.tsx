import React from 'react';

export type StackedButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
};

/** Rectangular stacked CTA button matching the UI kit */
export function StackedButton({ label, children, className = '', ...props }: StackedButtonProps) {
  return (
    <button className={`stacked-button rect-btn ${className}`} {...props}>
      <div className="layer l1" />
      <div className="layer l2 feathered" />
      <div className="layer l3 feathered" />
      <div className="layer l4 feathered" />
      <div className="layer l5 feathered" />
      <div className="layer l6 feathered" />
      <span className="relative z-10 font-medium text-white font-mono text-lg tracking-wide">
        {children ?? label}
      </span>
    </button>
  );
}

export default StackedButton;
