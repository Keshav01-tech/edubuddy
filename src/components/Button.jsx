import React from 'react';

export const Button = ({
  children, onClick, type = 'button',
  variant = 'primary', size = 'md',
  disabled = false, className = '', icon, ...props
}) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 disabled:opacity-40 disabled:pointer-events-none select-none';

  const variants = {
    primary:   'bg-neutral-950 text-white shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_6px_16px_-6px_rgba(0,0,0,0.6)] hover:bg-neutral-800',
    secondary: 'bg-white ring-1 ring-neutral-200 text-neutral-700 shadow-sm hover:bg-neutral-50 hover:ring-neutral-300',
    danger:    'bg-neutral-900 text-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.6)] hover:bg-neutral-900',
    ghost:     'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800',
    outline:   'ring-1 ring-brand-300 text-brand-700 hover:bg-brand-50',
    accent:    'bg-brand-600 text-white shadow-sm hover:bg-brand-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-sm font-semibold gap-2',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
