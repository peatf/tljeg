import React from 'react';

export type NavButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  ariaLabel: string;
};

/** Circular icon nav button matching the UI kit */
export function NavButton({ active, ariaLabel, className = '', children, ...props }: NavButtonProps) {
  const activeClass = active ? 'active' : '';
  return (
    <button className={`nav-btn stacked-button ${activeClass} ${className}`} aria-label={ariaLabel} {...props}>
      <div className="layer l1" />
      <div className="layer l2 feathered" />
      <div className="layer l3 feathered" />
      <div className="layer l4" />
      <span className="nav-icon">{children}</span>
    </button>
  );
}

export default NavButton;

