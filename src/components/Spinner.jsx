import React from 'react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-8 h-8 border-2' };
  return (
    <div className={`inline-flex ${className}`}>
      <div className={`animate-spin rounded-full border-slate-200 border-t-brand-500 ${sizes[size]}`} />
    </div>
  );
};

export const ProcessingIndicator = ({ text = 'Generating...' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <Spinner size="lg" />
    <p className="text-sm text-slate-500">{text}</p>
  </div>
);
