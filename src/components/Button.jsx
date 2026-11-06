import React from 'react';

export const Button = ({
  children, onClick, type = 'button',
  variant = 'primary', size = 'md',
  disabled = false, className = '', icon, ...props
}) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#60c1e5]/60 disabled:opacity-40 disabled:pointer-events-none select-none';

  const variants = {
    primary:   'bg-[#005a9c] text-white hover:brightness-95',
    secondary: 'bg-white ring-1 ring-neutral-200 text-neutral-800 hover:bg-neutral-50',
    danger:    'bg-[#005a9c] text-white hover:brightness-95',
    ghost:     'text-neutral-600 hover:bg-white/70 hover:text-neutral-900',
    outline:   'ring-1 ring-[#c4c4c4] text-[#005a9c] hover:bg-[#f8f8f8]',
    accent:    'bg-[#c4c4c4] text-neutral-900 hover:brightness-95',
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
