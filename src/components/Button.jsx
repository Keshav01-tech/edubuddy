import React from 'react';

export const Button = ({
  children, onClick, type = 'button',
  variant = 'primary', size = 'md',
  disabled = false, className = '', icon, ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none select-none';

  const variants = {
    primary:   'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
    danger:    'bg-rose-500 text-white hover:bg-rose-600',
    ghost:     'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
    outline:   'border border-brand-300 text-brand-700 hover:bg-brand-50',
    accent:    'bg-brand-600 text-white hover:bg-brand-700',
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
